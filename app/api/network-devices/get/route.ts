import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { page = 1, ITEMS_PER_PAGE = 10 } = await request.json()
    
    const totalItems = await (prisma as any).network_device.count()
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)
    
    const devices = await (prisma as any).network_device.findMany({
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      devices,
      maxPage,
      totalItems
    })
  } catch (error) {
    console.error('Network devices fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch network devices' },
      { status: 500 }
    )
  }
} 