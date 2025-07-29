import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Handle empty request body gracefully
    let requestBody = {}
    try {
      const body = await request.text()
      if (body.trim()) {
        requestBody = JSON.parse(body)
      }
    } catch (parseError) {
      // If JSON parsing fails, continue with empty object
      console.warn('Failed to parse request body, using defaults')
    }

    const { 
      page = 1, 
      ITEMS_PER_PAGE = 10, 
      type 
    } = requestBody as { 
      page?: number; 
      ITEMS_PER_PAGE?: number; 
      type?: string; 
    }

    // Build query conditions
    const whereCondition = type ? { type } : {}
    
    const totalItems = await (prisma as any).network_device.count({ 
      where: whereCondition 
    })
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)
    
    const devices = await (prisma as any).network_device.findMany({
      where: whereCondition,
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: {
        name: 'asc'
      }
    })

    // Return consistent response format for both pagination and type-filtered requests
    return NextResponse.json({
      success: true,
      devices,
      maxPage,
      totalItems
    })
  } catch (error) {
    console.error('Network devices fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch network devices' 
      },
      { status: 500 }
    )
  }
} 