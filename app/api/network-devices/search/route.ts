import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { searchTerm, page = 1, ITEMS_PER_PAGE = 10 } = await request.json()

    if (!searchTerm) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      )
    }

    const searchCondition = {
      OR: [
        { name: { contains: searchTerm, mode: 'insensitive' as const } },
        { type: { contains: searchTerm, mode: 'insensitive' as const } },
        { brand: { contains: searchTerm, mode: 'insensitive' as const } },
        { model: { contains: searchTerm, mode: 'insensitive' as const } },
        { location: { contains: searchTerm, mode: 'insensitive' as const } },
        { ip: { contains: searchTerm, mode: 'insensitive' as const } }
      ]
    }

    const totalItems = await (prisma as any).network_device.count({
      where: searchCondition
    })
    
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)
    
    const devices = await (prisma as any).network_device.findMany({
      where: searchCondition,
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
    console.error('Network devices search error:', error)
    return NextResponse.json(
      { error: 'Failed to search network devices' },
      { status: 500 }
    )
  }
} 