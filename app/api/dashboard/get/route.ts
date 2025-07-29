import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get counts for each type of infrastructure
    const [
      serverCount,
      virtualMachineCount,
      networkDeviceCount,
      onlineServersCount,
      onlineVirtualMachinesCount,
      onlineNetworkDevicesCount
    ] = await Promise.all([
      prisma.server.count(),
      prisma.virtual_machine.count(),
      prisma.network_device.count(),
      prisma.server.count({ where: { online: true } }),
      prisma.virtual_machine.count({ where: { online: true } }),
      prisma.network_device.count({ where: { online: true } })
    ])

    return NextResponse.json({
      serverCount,
      virtualMachineCount,
      networkDeviceCount,
      onlineServersCount,
      onlineVirtualMachinesCount,
      onlineNetworkDevicesCount
    })
  } catch (error: unknown) {
    console.error("Dashboard API error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
