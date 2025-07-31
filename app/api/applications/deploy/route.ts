import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

interface DeployRequest {
  applicationId: number
  customPorts?: Record<string, string>
  customEnvironment?: Record<string, string>
  customVolumes?: Record<string, string>
}

interface DeploymentConfiguration {
  applicationId: number
  ports: { hostPort: string; containerPort: string; protocol: string }[]
  environment: { key: string; value: string }[]
  volumes: { hostPath: string; containerPath: string; mode: string }[]
  containerName?: string
  restartPolicy: string
  networkMode: string
  privileged: boolean
  autoRemove: boolean
}

// Function to ensure host directories exist
async function ensureDirectoriesExist(volumes: any[]) {
  for (const volume of volumes) {
    const hostPath = typeof volume === 'object' ? volume.hostPath : Object.keys(volume)[0]
    
    // Skip special Docker paths
    if (hostPath === '/var/run/docker.sock' || hostPath.startsWith('portainer_') || hostPath.startsWith('/var/run/')) {
      continue
    }
    
    try {
      // Create directory if it doesn't exist
      const fullPath = path.resolve(hostPath)
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true, mode: 0o755 })
        console.log(`Created directory: ${fullPath}`)
      }
    } catch (error) {
      console.warn(`Could not create directory ${hostPath}:`, error)
    }
  }
}

// Function to check Docker availability
async function checkDockerAvailable() {
  try {
    await execAsync('docker --version')
    return true
  } catch (error) {
    throw new Error('Docker is not installed or not running. Please install Docker and ensure it is running.')
  }
}

// Function to pull Docker image if needed
async function ensureImageAvailable(dockerImage: string, version: string) {
  const fullImageName = `${dockerImage}:${version}`
  
  try {
    // Check if image exists locally
    const { stdout } = await execAsync(`docker images ${fullImageName} --format "{{.Repository}}"`)
    
    if (!stdout.trim()) {
      console.log(`Pulling Docker image: ${fullImageName}`)
      await execAsync(`docker pull ${fullImageName}`)
      console.log(`Successfully pulled image: ${fullImageName}`)
    } else {
      console.log(`Image ${fullImageName} already exists locally`)
    }
  } catch (error) {
    console.warn(`Could not pull image ${fullImageName}:`, error)
    throw new Error(`Failed to pull Docker image: ${fullImageName}. Please check if the image exists and you have internet connectivity.`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check Docker availability first
    await checkDockerAvailable()
    
    const body = await request.json()
    
    // Check if this is new configuration format or legacy format
    const isNewConfig = body.ports && Array.isArray(body.ports)
    
    if (isNewConfig) {
      // Handle new configuration format
      return await deployWithConfig(body as DeploymentConfiguration)
    } else {
      // Handle legacy format for backward compatibility
      const { applicationId, customPorts, customEnvironment, customVolumes } = body as DeployRequest
      return await deployWithDefaults(applicationId, customPorts, customEnvironment, customVolumes)
    }
  } catch (error: any) {
    console.error('Deploy API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to deploy application' 
      },
      { status: 500 }
    )
  }
}

async function deployWithConfig(config: DeploymentConfiguration) {
  const { applicationId } = config

  if (!applicationId) {
    return NextResponse.json(
      { error: 'Application ID is required' },
      { status: 400 }
    )
  }

  // Fetch the application from database
  const application = await (prisma as any).application.findUnique({
    where: { id: applicationId }
  })

  if (!application) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  if (application.deployed) {
    return NextResponse.json(
      { error: 'Application is already deployed' },
      { status: 400 }
    )
  }

  // Update status to deploying
  await (prisma as any).application.update({
    where: { id: applicationId },
    data: { status: 'deploying' }
  })

  // Log deployment action
  await (prisma as any).application_history.create({
    data: {
      applicationId,
      action: 'deploying',
      status: 'started',
      message: 'Starting deployment process with custom configuration'
    }
  })

  try {
    // Ensure Docker image is available
    await ensureImageAvailable(application.dockerImage, application.version)
    
    // Ensure host directories exist
    await ensureDirectoriesExist(config.volumes)
    
    // Build Docker command with custom configuration
    const containerName = config.containerName || `serverdash-${application.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${applicationId}`
    
    let dockerCmd = `docker run -d --name ${containerName}`

    // Add restart policy
    if (config.restartPolicy && config.restartPolicy !== 'no') {
      dockerCmd += ` --restart ${config.restartPolicy}`
    }

    // Add network mode
    if (config.networkMode && config.networkMode !== 'bridge') {
      dockerCmd += ` --network ${config.networkMode}`
    }

    // Add privileged mode
    if (config.privileged) {
      dockerCmd += ` --privileged`
    }

    // Add auto-remove
    if (config.autoRemove) {
      dockerCmd += ` --rm`
    }

    // Add port mappings
    config.ports.forEach(({ hostPort, containerPort, protocol }) => {
      if (hostPort && containerPort) {
        const protocolSuffix = protocol === 'udp' ? '/udp' : ''
        dockerCmd += ` -p ${hostPort}:${containerPort}${protocolSuffix}`
      }
    })

    // Add environment variables
    config.environment.forEach(({ key, value }) => {
      if (key && value) {
        dockerCmd += ` -e "${key}=${value}"`
      }
    })

    // Add volume mounts
    config.volumes.forEach(({ hostPath, containerPath, mode }) => {
      if (hostPath && containerPath) {
        dockerCmd += ` -v "${hostPath}:${containerPath}:${mode}"`
      }
    })

    // Add the image
    dockerCmd += ` ${application.dockerImage}:${application.version}`

    // Prepare deployed ports mapping (hostPort:containerPort)
    const deployedPorts: Record<string, string> = {}
    config.ports.forEach((port: { hostPort: string; containerPort: string; protocol: string }) => {
      deployedPorts[port.hostPort] = port.containerPort
    })

    return await executeDeployment(application, dockerCmd, containerName, applicationId, deployedPorts)

  } catch (deployError: any) {
    return await handleDeploymentError(applicationId, deployError)
  }
}

async function deployWithDefaults(applicationId: number, customPorts?: Record<string, string>, customEnvironment?: Record<string, string>, customVolumes?: Record<string, string>) {
  if (!applicationId) {
    return NextResponse.json(
      { error: 'Application ID is required' },
      { status: 400 }
    )
  }

  // Fetch the application from database
  const application = await (prisma as any).application.findUnique({
    where: { id: applicationId }
  })

  if (!application) {
    return NextResponse.json(
      { error: 'Application not found' },
      { status: 404 }
    )
  }

  if (application.deployed) {
    return NextResponse.json(
      { error: 'Application is already deployed' },
      { status: 400 }
    )
  }

  // Update status to deploying
  await (prisma as any).application.update({
    where: { id: applicationId },
    data: { status: 'deploying' }
  })

  // Log deployment action
  await (prisma as any).application_history.create({
    data: {
      applicationId,
      action: 'deploying',
      status: 'started',
      message: 'Starting deployment process'
    }
  })

  try {
    // Ensure Docker image is available
    await ensureImageAvailable(application.dockerImage, application.version)
    
    // Parse existing configuration
    const ports = customPorts || (application.ports ? JSON.parse(application.ports) : {})
    const environment = customEnvironment || (application.environment ? JSON.parse(application.environment) : {})
    const volumes = customVolumes || (application.volumes ? JSON.parse(application.volumes) : {})
    const commands = application.commands ? JSON.parse(application.commands) : {}

    // Ensure host directories exist
    await ensureDirectoriesExist([volumes])

    // Build Docker command
    const containerName = `serverdash-${application.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${applicationId}`
    
    let dockerCmd = `docker run -d --name ${containerName} --restart unless-stopped`

    // Add port mappings
    for (const [hostPort, containerPort] of Object.entries(ports)) {
      dockerCmd += ` -p ${hostPort}:${containerPort}`
    }

    // Add environment variables
    for (const [key, value] of Object.entries(environment)) {
      dockerCmd += ` -e ${key}="${value}"`
    }

    // Add volume mappings
    for (const [hostPath, containerPath] of Object.entries(volumes)) {
      dockerCmd += ` -v ${hostPath}:${containerPath}`
    }

    // Add additional commands
    if (commands.networks) {
      for (const network of commands.networks) {
        dockerCmd += ` --network ${network}`
      }
    }

    if (commands.labels) {
      for (const [key, value] of Object.entries(commands.labels)) {
        dockerCmd += ` --label ${key}="${value}"`
      }
    }

    // Add the image
    dockerCmd += ` ${application.dockerImage}:${application.version}`

    // Add command args if specified
    if (commands.args) {
      dockerCmd += ` ${commands.args}`
    }

    return await executeDeployment(application, dockerCmd, containerName, applicationId, undefined)

  } catch (deployError: any) {
    return await handleDeploymentError(applicationId, deployError)
  }
}

async function executeDeployment(application: any, dockerCmd: string, containerName: string, applicationId: number, deployedPorts?: Record<string, string>) {
  console.log(`Executing Docker command: ${dockerCmd}`)

  // Clean up any existing container with the same name
  try {
    console.log(`Checking for existing container: ${containerName}`)
    const { stdout: existingContainer } = await execAsync(`docker ps -a --filter "name=${containerName}" --format "{{.Names}}"`)
    
    if (existingContainer.trim() === containerName) {
      console.log(`Found existing container ${containerName}, removing it...`)
      
      // Stop the container if it's running
      try {
        await execAsync(`docker stop ${containerName}`)
        console.log(`Stopped existing container: ${containerName}`)
      } catch (stopError) {
        console.log(`Container ${containerName} was not running or already stopped`)
      }
      
      // Remove the container
      await execAsync(`docker rm ${containerName}`)
      console.log(`Removed existing container: ${containerName}`)
    } else {
      console.log(`No existing container found with name: ${containerName}`)
    }
  } catch (cleanupError) {
    console.log(`Error during container cleanup: ${cleanupError}`)
    // Continue with deployment even if cleanup fails
  }

  // Check for port conflicts and clean up
  const portPattern = /-p (\d+):/g
  let match
  const usedPorts = []
  
  while ((match = portPattern.exec(dockerCmd)) !== null) {
    usedPorts.push(match[1])
  }
  
  if (usedPorts.length > 0) {
    console.log(`Checking for port conflicts on ports: ${usedPorts.join(', ')}`)
    
    for (const port of usedPorts) {
      try {
        // Check if port is in use by any Docker container
        const { stdout: containerUsingPort } = await execAsync(`docker ps --filter "publish=${port}" --format "{{.Names}}"`)
        
        if (containerUsingPort.trim()) {
          const conflictingContainers = containerUsingPort.trim().split('\n')
          for (const conflictContainer of conflictingContainers) {
            if (conflictContainer && conflictContainer !== containerName) {
              console.log(`Port ${port} is in use by container: ${conflictContainer}`)
              console.log(`Stopping and removing conflicting container: ${conflictContainer}`)
              
              try {
                await execAsync(`docker stop ${conflictContainer}`)
                await execAsync(`docker rm ${conflictContainer}`)
                console.log(`Successfully removed conflicting container: ${conflictContainer}`)
              } catch (removeError) {
                console.log(`Could not remove conflicting container ${conflictContainer}: ${removeError}`)
              }
            }
          }
        }
        
        // Also check for non-Docker processes using the port
        try {
          const { stdout: processOnPort } = await execAsync(`lsof -ti:${port}`)
          if (processOnPort.trim()) {
            console.log(`Port ${port} is in use by non-Docker process(es): ${processOnPort.trim()}`)
            // Don't automatically kill non-Docker processes, just warn
          }
        } catch (lsofError) {
          // lsof command not available or no process found, which is fine
          console.log(`Port ${port} appears to be free`)
        }
        
      } catch (portCheckError) {
        console.log(`Error checking port ${port}: ${portCheckError}`)
      }
    }
    
    // Small delay to let Docker release ports
    console.log('Waiting for Docker to release ports...')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Execute Docker command
  const { stdout, stderr } = await execAsync(dockerCmd)
  
  if (stderr && !stdout) {
    console.log(`Docker command failed with stderr: ${stderr}`)
    
    // Handle specific Docker errors
    if (stderr.includes('bind: address already in use')) {
      throw new Error('Port is already in use. Please stop the conflicting service or choose a different port.')
    }
    if (stderr.includes('pull access denied') || stderr.includes('repository does not exist')) {
      throw new Error('Docker image not found or access denied. Please check the image name.')
    }
    if (stderr.includes('container name') && stderr.includes('already in use')) {
      throw new Error('Container name conflict detected. The cleanup process may have failed. Please try again.')
    }
    
    throw new Error(stderr)
  }

  const containerId = stdout.trim()

  // Verify container is running
  const { stdout: inspectOut } = await execAsync(`docker inspect ${containerId} --format="{{.State.Status}}"`)
  const containerStatus = inspectOut.trim()

  if (containerStatus !== 'running') {
    // Get container logs for debugging
    const { stdout: logs } = await execAsync(`docker logs ${containerId}`).catch(() => ({ stdout: '' }))
    throw new Error(`Container failed to start. Status: ${containerStatus}. Logs: ${logs}`)
  }

  // Update application with deployment info (including deployed ports if provided)
  const updateData: any = {
    deployed: true,
    status: 'running',
    containerId: containerId
  }
  
  if (deployedPorts) {
    updateData.ports = JSON.stringify(deployedPorts)
  }

  await (prisma as any).application.update({
    where: { id: applicationId },
    data: updateData
  })

  // Log successful deployment
  await (prisma as any).application_history.create({
    data: {
      applicationId,
      action: 'deployed',
      status: 'success',
      message: `Successfully deployed container ${containerId}`
    }
  })

  return NextResponse.json({
    success: true,
    containerId,
    message: 'Application deployed successfully'
  })
}

async function handleDeploymentError(applicationId: number, deployError: any) {
  console.error('Deployment error:', deployError)
  
  // Update status to error
  await (prisma as any).application.update({
    where: { id: applicationId },
    data: { status: 'error' }
  })

  // Log deployment failure
  await (prisma as any).application_history.create({
    data: {
      applicationId,
      action: 'deployed',
      status: 'error',
      message: `Deployment failed: ${deployError.message}`
    }
  })

  return NextResponse.json(
    { 
      success: false,
      error: `Deployment failed: ${deployError.message}` 
    },
    { status: 500 }
  )
} 