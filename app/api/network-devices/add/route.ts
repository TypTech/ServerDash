import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      type,
      brand,
      model,
      icon,
      ip,
      macAddress,
      location,
      description,
      portsCount,
      wirelessStandard,
      frequency,
      powerConsumption,
      firmwareVersion,
      managementURL,
      monitoring,
      monitoringURL
    } = await request.json()

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    const device = await (prisma as any).network_device.create({
      data: {
        name,
        type,
        brand: brand || null,
        model: model || null,
        icon: icon || null,
        ip: ip || null,
        macAddress: macAddress || null,
        location: location || null,
        description: description || null,
        portsCount: portsCount || null,
        wirelessStandard: wirelessStandard || null,
        frequency: frequency || null,
        powerConsumption: powerConsumption || null,
        firmwareVersion: firmwareVersion || null,
        managementURL: managementURL || null,
        monitoring: monitoring || false,
        monitoringURL: monitoringURL || null,
        online: true,
        uptime: null,
        responseTime: null,
        lastChecked: null,
        packetLoss: null,
        bandwidth: null
      }
    })

    return NextResponse.json({ device }, { status: 201 })
  } catch (error) {
    console.error('Network device create error:', error)
    return NextResponse.json(
      { error: 'Failed to create network device' },
      { status: 500 }
    )
  }
} 