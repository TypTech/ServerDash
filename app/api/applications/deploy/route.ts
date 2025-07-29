import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

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

export async function POST(request: NextRequest) {
  try {
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

    return await executeDeployment(application, dockerCmd, containerName, applicationId)

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
    // Parse existing configuration
    const ports = customPorts || (application.ports ? JSON.parse(application.ports) : {})
    const environment = customEnvironment || (application.environment ? JSON.parse(application.environment) : {})
    const volumes = customVolumes || (application.volumes ? JSON.parse(application.volumes) : {})
    const commands = application.commands ? JSON.parse(application.commands) : {}

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

    return await executeDeployment(application, dockerCmd, containerName, applicationId)

  } catch (deployError: any) {
    return await handleDeploymentError(applicationId, deployError)
  }
}

async function executeDeployment(application: any, dockerCmd: string, containerName: string, applicationId: number) {
  console.log(`Executing Docker command: ${dockerCmd}`)

  // Execute Docker command
  const { stdout, stderr } = await execAsync(dockerCmd)
  
  if (stderr && !stdout) {
    // Handle specific Docker errors
    if (stderr.includes('bind: address already in use')) {
      throw new Error('Port is already in use. Please stop the conflicting service or choose a different port.')
    }
    if (stderr.includes('pull access denied') || stderr.includes('repository does not exist')) {
      throw new Error('Docker image not found or access denied. Please check the image name.')
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

  // Update application with deployment info
  await (prisma as any).application.update({
    where: { id: applicationId },
    data: {
      deployed: true,
      status: 'running',
      containerId: containerId
    }
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