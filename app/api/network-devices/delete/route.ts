import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      )
    }

    // Delete related history entries first
    await (prisma as any).network_device_history.deleteMany({
      where: { deviceId: parseInt(id) }
    })

    // Delete the device
    const device = await (prisma as any).network_device.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ message: 'Network device deleted successfully' })
  } catch (error) {
    console.error('Network device delete error:', error)
    return NextResponse.json(
      { error: 'Failed to delete network device' },
      { status: 500 }
    )
  }
} 