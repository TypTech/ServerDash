import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const {
      id,
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
    if (!id || !name || !type) {
      return NextResponse.json(
        { error: 'ID, name and type are required' },
        { status: 400 }
      )
    }

    const device = await (prisma as any).network_device.update({
      where: { id: parseInt(id) },
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
        monitoringURL: monitoringURL || null
      }
    })

    return NextResponse.json({ device })
  } catch (error) {
    console.error('Network device update error:', error)
    return NextResponse.json(
      { error: 'Failed to update network device' },
      { status: 500 }
    )
  }
} 