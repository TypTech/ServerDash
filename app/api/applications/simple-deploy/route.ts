import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    console.log('[SIMPLE-DEPLOY] Starting...')
    
    const body = await request.json()
    const { applicationId } = body

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 })
    }

    console.log(`[SIMPLE-DEPLOY] Fetching application ${applicationId}`)

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

    console.log(`[SIMPLE-DEPLOY] Found application: ${application.name}`)

    // Parse configuration safely
    const ports = application.ports ? JSON.parse(application.ports) : {}
    const environment = application.environment ? JSON.parse(application.environment) : {}
    
    console.log(`[SIMPLE-DEPLOY] Ports: ${JSON.stringify(ports)}`)

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

    // Add the image
    dockerCmd += ` ${application.dockerImage}:${application.version}`
    
    console.log(`[SIMPLE-DEPLOY] Executing: ${dockerCmd}`)

    // Execute Docker command
    const { stdout, stderr } = await execAsync(dockerCmd)
    
    if (stderr && !stdout) {
      console.log(`[SIMPLE-DEPLOY] Error: ${stderr}`)
      return NextResponse.json({ 
        success: false, 
        error: `Docker error: ${stderr}` 
      }, { status: 500 })
    }

    const containerId = stdout.trim()
    console.log(`[SIMPLE-DEPLOY] Container started: ${containerId}`)

    // Update application in database
    await (prisma as any).application.update({
      where: { id: applicationId },
      data: {
        deployed: true,
        status: 'running',
        containerId: containerId
      }
    })

    console.log(`[SIMPLE-DEPLOY] Success!`)

    return NextResponse.json({
      success: true,
      containerId,
      message: 'Application deployed successfully'
    })

  } catch (error: any) {
    console.error('[SIMPLE-DEPLOY] Error:', error)
    return NextResponse.json({
      success: false,
      error: `Deployment failed: ${error.message}`
    }, { status: 500 })
  }
} 