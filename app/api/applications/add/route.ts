import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const {
      name,
      description,
      icon,
      category,
      dockerImage,
      ports,
      environment,
      volumes,
      commands,
      featured,
      tags,
      version,
      author,
      website,
      documentation
    } = await request.json()

    // Validate required fields
    if (!name || !dockerImage) {
      return NextResponse.json(
        { error: 'Name and Docker image are required' },
        { status: 400 }
      )
    }

    // Validate JSON strings
    const validateJson = (field: any, fieldName: string) => {
      if (field && typeof field !== 'string') {
        try {
          return JSON.stringify(field)
        } catch {
          throw new Error(`Invalid ${fieldName} format`)
        }
      }
      return field
    }

    try {
      const application = await (prisma as any).application.create({
        data: {
          name,
          description: description || null,
          icon: icon || null,
          category: category || 'other',
          dockerImage,
          ports: validateJson(ports, 'ports'),
          environment: validateJson(environment, 'environment'),
          volumes: validateJson(volumes, 'volumes'),
          commands: validateJson(commands, 'commands'),
          featured: featured || false,
          tags: tags || null,
          version: version || 'latest',
          author: author || null,
          website: website || null,
          documentation: documentation || null
        }
      })

      return NextResponse.json({ 
        success: true,
        application 
      }, { status: 201 })
    } catch (dbError: any) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create application in database' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Application create error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create application' },
      { status: 500 }
    )
  }
} 