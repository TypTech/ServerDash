import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    const { applicationId, command = '/bin/sh', interactive = false } = await request.json()

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

    if (!application.containerId) {
      return NextResponse.json(
        { error: 'No container ID found for this application' },
        { status: 400 }
      )
    }

    try {
      // Check if container is running
      const { stdout: statusCheck } = await execAsync(`docker inspect ${application.containerId} --format="{{.State.Status}}"`)
      
      if (statusCheck.trim() !== 'running') {
        return NextResponse.json(
          { 
            success: false,
            error: 'Container is not running. Please start the application first.' 
          },
          { status: 400 }
        )
      }

      // For interactive mode, return connection info for web terminal
      if (interactive) {
        return NextResponse.json({
          success: true,
          message: 'Terminal access available',
          containerId: application.containerId,
          applicationName: application.name,
          terminalCommand: `docker exec -it ${application.containerId} ${command}`
        })
      }

      // Try different shells and execution methods
      const shells = ['/bin/sh', '/bin/bash', '/bin/ash']
      let output = ''
      let execSuccess = false

      // First try direct command execution (for containers with the command available)
      if (!command.includes(' ')) {
        try {
          const directCmd = `docker exec ${application.containerId} ${command}`
          const { stdout, stderr } = await execAsync(directCmd)
          output = stdout || stderr || 'Command executed successfully'
          execSuccess = true
        } catch (error) {
          // Continue to shell-based execution
        }
      }

      // If direct execution failed, try with different shells
      if (!execSuccess) {
        for (const shell of shells) {
          try {
            const dockerCmd = `docker exec ${application.containerId} ${shell} -c "${command}"`
            const { stdout, stderr } = await execAsync(dockerCmd)
            output = stdout || stderr || 'Command executed successfully'
            execSuccess = true
            break
          } catch (error) {
            // Try next shell
            continue
          }
        }
      }

      // If all shells failed, try without shell wrapper
      if (!execSuccess) {
        try {
          const fallbackCmd = `docker exec ${application.containerId} ${command}`
          const { stdout, stderr } = await execAsync(fallbackCmd)
          output = stdout || stderr || 'Command executed successfully'
          execSuccess = true
        } catch (error: any) {
          output = `Command execution failed. This container might not support shell commands.\nError: ${error.stderr || error.message}`
        }
      }

      return NextResponse.json({
        success: true,
        output: output.trim(),
        command: command,
        applicationName: application.name,
        containerId: application.containerId
      })

    } catch (error: any) {
      return NextResponse.json(
        { 
          success: false,
          error: `Failed to execute command: ${error.message}`,
          output: error.stderr || 'Container not accessible'
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('Terminal API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to access application terminal' 
      },
      { status: 500 }
    )
  }
} 