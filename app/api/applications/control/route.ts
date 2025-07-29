import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface ControlRequest {
  applicationId: number
  action: 'start' | 'stop' | 'remove'
}

export async function POST(request: NextRequest) {
  try {
    const { applicationId, action } = await request.json() as ControlRequest

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'Application ID and action are required' },
        { status: 400 }
      )
    }

    if (!['start', 'stop', 'remove'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be start, stop, or remove' },
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

    if (!application.deployed && action !== 'remove') {
      return NextResponse.json(
        { error: 'Application is not deployed' },
        { status: 400 }
      )
    }

    if (!application.containerId && action !== 'remove') {
      return NextResponse.json(
        { error: 'No container ID found for this application' },
        { status: 400 }
      )
    }

    try {
      let dockerCmd = ''
      let newStatus = ''
      let actionMessage = ''

      switch (action) {
        case 'start':
          dockerCmd = `docker start ${application.containerId}`
          newStatus = 'running'
          actionMessage = 'Container started successfully'
          break
        
        case 'stop':
          dockerCmd = `docker stop ${application.containerId}`
          newStatus = 'stopped'
          actionMessage = 'Container stopped successfully'
          break
        
        case 'remove':
          // First stop the container if it's running
          if (application.containerId) {
            try {
              await execAsync(`docker stop ${application.containerId}`)
            } catch (stopError) {
              // Container might already be stopped, continue with removal
              console.log('Container stop failed or already stopped:', stopError)
            }
            
            try {
              await execAsync(`docker rm ${application.containerId}`)
            } catch (removeError) {
              // Container might already be removed
              console.log('Container remove failed or already removed:', removeError)
            }
          }
          
          newStatus = 'stopped'
          actionMessage = 'Container removed successfully'
          break
      }

      // Execute Docker command for start/stop
      if (action !== 'remove') {
        const { stdout, stderr } = await execAsync(dockerCmd)
        
        if (stderr && !stdout) {
          throw new Error(stderr)
        }

        // Verify container status
        const { stdout: inspectOut } = await execAsync(`docker inspect ${application.containerId} --format="{{.State.Status}}"`)
        const containerStatus = inspectOut.trim()
        
        if (action === 'start' && containerStatus !== 'running') {
          throw new Error(`Failed to start container. Status: ${containerStatus}`)
        }
        
        if (action === 'stop' && containerStatus === 'running') {
          throw new Error(`Failed to stop container. Status: ${containerStatus}`)
        }
      }

      // Update application status in database
      const updateData: any = { status: newStatus }
      
      if (action === 'remove') {
        updateData.deployed = false
        updateData.containerId = null
      }

      await (prisma as any).application.update({
        where: { id: applicationId },
        data: updateData
      })

      // Log the action
      await (prisma as any).application_history.create({
        data: {
          applicationId,
          action,
          status: 'success',
          message: actionMessage
        }
      })

      return NextResponse.json({
        success: true,
        message: actionMessage,
        status: newStatus
      })

    } catch (controlError: any) {
      console.error(`${action} error:`, controlError)
      
      // Update status to error
      await (prisma as any).application.update({
        where: { id: applicationId },
        data: { status: 'error' }
      })

      // Log the failure
      await (prisma as any).application_history.create({
        data: {
          applicationId,
          action,
          status: 'error',
          message: `${action} failed: ${controlError.message}`
        }
      })

      return NextResponse.json(
        { 
          success: false,
          error: `${action} failed: ${controlError.message}` 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Control API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to control application' 
      },
      { status: 500 }
    )
  }
} 