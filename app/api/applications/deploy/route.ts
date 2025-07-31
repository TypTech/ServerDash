import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('[DEPLOY] Starting deployment...')
    
    const body = await request.json()
    const { applicationId } = body

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    console.log(`[DEPLOY] Deploying application ${applicationId}`)

    // Fetch the application from database
    const application = await (prisma as any).application.findUnique({
      where: { id: applicationId }
    })

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    if (application.deployed) {
      return NextResponse.json({ error: 'Application is already deployed' }, { status: 400 })
    }

    console.log(`[DEPLOY] Found application: ${application.name}`)

    // Parse configuration safely
    const ports = application.ports ? JSON.parse(application.ports) : {}
    const environment = application.environment ? JSON.parse(application.environment) : {}
    const volumes = application.volumes ? JSON.parse(application.volumes) : {}
    const commands = application.commands ? JSON.parse(application.commands) : {}
    
    console.log(`[DEPLOY] Ports: ${JSON.stringify(ports)}`)
    console.log(`[DEPLOY] Environment: ${JSON.stringify(environment)}`)
    console.log(`[DEPLOY] Volumes: ${JSON.stringify(volumes)}`)

    // Create required directories
    if (volumes && typeof volumes === 'object') {
      for (const [hostPath, containerPath] of Object.entries(volumes)) {
        if (hostPath && typeof hostPath === 'string' && !hostPath.startsWith('/var/run/') && !hostPath.includes('docker.sock')) {
          try {
            const fullPath = path.resolve(hostPath)
            if (!fs.existsSync(fullPath)) {
              fs.mkdirSync(fullPath, { recursive: true, mode: 0o755 })
              console.log(`[DEPLOY] Created directory: ${fullPath}`)
            }
          } catch (error) {
            console.warn(`[DEPLOY] Could not create directory ${hostPath}:`, error)
          }
        }
      }
    }

    // Build Docker command
    const containerName = `serverdash-${application.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${applicationId}`
    let dockerCmd = `docker run -d --name ${containerName} --restart unless-stopped`

    // Add port mappings
    for (const [hostPort, containerPort] of Object.entries(ports)) {
      dockerCmd += ` -p ${hostPort}:${containerPort}`
    }

    // Add environment variables
    for (const [key, value] of Object.entries(environment)) {
      dockerCmd += ` -e "${key}=${value}"`
    }

    // Add volume mappings
    if (volumes && typeof volumes === 'object') {
      for (const [hostPath, containerPath] of Object.entries(volumes)) {
        if (hostPath && containerPath) {
          dockerCmd += ` -v "${hostPath}:${containerPath}"`
        }
      }
    }

    // Add capabilities and sysctls for special containers (like WireGuard)
    if (commands.capabilities) {
      for (const capability of commands.capabilities) {
        dockerCmd += ` --cap-add=${capability}`
      }
    }

    if (commands.sysctls) {
      for (const sysctl of commands.sysctls) {
        dockerCmd += ` --sysctl=${sysctl}`
      }
    }

    // Add the image
    dockerCmd += ` ${application.dockerImage}:${application.version}`
    
    // Add command arguments if specified
    if (commands.args) {
      dockerCmd += ` ${commands.args}`
    }
    
    console.log(`[DEPLOY] Executing: ${dockerCmd}`)

    // Clean up any existing container with the same name
    try {
      await execAsync(`docker stop ${containerName}`).catch(() => {})
      await execAsync(`docker rm ${containerName}`).catch(() => {})
      console.log(`[DEPLOY] Cleaned up existing container: ${containerName}`)
    } catch (error) {
      console.log(`[DEPLOY] No existing container to clean up`)
    }

    // Execute Docker command
    const { stdout, stderr } = await execAsync(dockerCmd)
    
    if (stderr && !stdout) {
      console.log(`[DEPLOY] Docker error: ${stderr}`)
      
      // Update status to failed
      await (prisma as any).application.update({
        where: { id: applicationId },
        data: { status: 'stopped' }
      })
      
      return NextResponse.json({ 
        success: false, 
        error: `Docker error: ${stderr}` 
      }, { status: 500 })
    }

    const containerId = stdout.trim()
    console.log(`[DEPLOY] Container started: ${containerId}`)

    // Verify container is running
    try {
      const { stdout: inspectOut } = await execAsync(`docker inspect ${containerId} --format="{{.State.Status}}"`)
      const containerStatus = inspectOut.trim()
      console.log(`[DEPLOY] Container status: ${containerStatus}`)
    } catch (error) {
      console.log(`[DEPLOY] Could not inspect container: ${error}`)
    }

    // Update application in database
    await (prisma as any).application.update({
      where: { id: applicationId },
      data: {
        deployed: true,
        status: 'running',
        containerId: containerId
      }
    })

    console.log(`[DEPLOY] Success! Application ${applicationId} deployed`)

    return NextResponse.json({
      success: true,
      containerId,
      message: 'Application deployed successfully'
    })

  } catch (error: any) {
    console.error('[DEPLOY] Error:', error)
    
    try {
      const body = await request.json()
      const { applicationId } = body
      
      if (applicationId) {
        await (prisma as any).application.update({
          where: { id: applicationId },
          data: { status: 'stopped' }
        })
      }
    } catch (dbError) {
      console.error('[DEPLOY] Could not update application status:', dbError)
    }

    return NextResponse.json({
      success: false,
      error: `Deployment failed: ${error.message}`
    }, { status: 500 })
  }
} 