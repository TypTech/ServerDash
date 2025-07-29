import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
  try {
    // Get all deployed applications
    const deployedApps = await (prisma as any).application.findMany({
      where: { deployed: true }
    })

    const statusUpdates = []

    for (const app of deployedApps) {
      if (!app.containerId) continue

      try {
        // Check if container exists and get its status
        const { stdout } = await execAsync(`docker inspect ${app.containerId} --format="{{.State.Status}}" 2>/dev/null`)
        const containerStatus = stdout.trim()
        
        let newStatus = 'error'
        if (containerStatus === 'running') {
          newStatus = 'running'
        } else if (containerStatus === 'exited') {
          newStatus = 'stopped'
        }

        // Update status if it has changed
        if (app.status !== newStatus) {
          await (prisma as any).application.update({
            where: { id: app.id },
            data: { status: newStatus }
          })

          statusUpdates.push({
            id: app.id,
            name: app.name,
            oldStatus: app.status,
            newStatus: newStatus
          })
        }
      } catch (error) {
        // Container not found or error - mark as stopped
        if (app.status !== 'stopped') {
          await (prisma as any).application.update({
            where: { id: app.id },
            data: { 
              status: 'stopped',
              deployed: false,
              containerId: null
            }
          })

          statusUpdates.push({
            id: app.id,
            name: app.name,
            oldStatus: app.status,
            newStatus: 'stopped',
            note: 'Container not found - marked as stopped'
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      updatedCount: statusUpdates.length,
      updates: statusUpdates
    })
  } catch (error: any) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to check application statuses' 
      },
      { status: 500 }
    )
  }
} 