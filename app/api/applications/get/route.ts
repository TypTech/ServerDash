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
      console.warn('Failed to parse request body, using defaults')
    }

    const { 
      page = 1, 
      ITEMS_PER_PAGE = 12, 
      category,
      search,
      deployed 
    } = requestBody as { 
      page?: number; 
      ITEMS_PER_PAGE?: number; 
      category?: string; 
      search?: string;
      deployed?: boolean;
    }

    // Build query conditions
    const whereCondition: any = {}
    
    if (category && category !== 'all') {
      whereCondition.category = category
    }
    
    if (search && search.trim()) {
      whereCondition.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
        { tags: { contains: search.trim(), mode: 'insensitive' } }
      ]
    }
    
    if (deployed !== undefined) {
      whereCondition.deployed = deployed
    }
    
    const totalItems = await (prisma as any).application.count({ 
      where: whereCondition 
    })
    const maxPage = Math.ceil(totalItems / ITEMS_PER_PAGE)
    
    const applications = await (prisma as any).application.findMany({
      where: whereCondition,
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
      orderBy: [
        { featured: 'desc' },
        { name: 'asc' }
      ]
    })

    return NextResponse.json({
      success: true,
      applications,
      maxPage,
      totalItems
    })
  } catch (error) {
    console.error('Applications fetch error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch applications' 
      },
      { status: 500 }
    )
  }
} 