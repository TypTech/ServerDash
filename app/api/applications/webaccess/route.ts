import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// Application web access configurations
const webAccessConfig: Record<string, { 
  defaultPort: string, 
  path: string, 
  protocol: string,
  requiresAuth?: boolean,
  defaultCredentials?: { username: string, password: string }
}> = {
  'grafana': { defaultPort: '3000', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'admin' } },
  'portainer': { defaultPort: '9000', path: '/', protocol: 'http' },
  'nginx': { defaultPort: '80', path: '/', protocol: 'http' },
  'apache': { defaultPort: '80', path: '/', protocol: 'http' },
  'nextcloud': { defaultPort: '80', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'admin123' } },
  'traefik': { defaultPort: '8080', path: '/', protocol: 'http' },
  'prometheus': { defaultPort: '9090', path: '/', protocol: 'http' },
  'elasticsearch': { defaultPort: '9200', path: '/', protocol: 'http' }
}

export async function POST(request: NextRequest) {
  try {
    const { applicationId } = await request.json()

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Fetch the application from database
    const application = await (prisma as any).application.findUnique({
      where: { id: applicationId }
    })

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Parse ports configuration
    let ports: Record<string, string> = {}
    if (application.ports) {
      try {
        ports = JSON.parse(application.ports)
      } catch (error) {
        console.error('Failed to parse ports:', error)
      }
    }

    // Get web access configuration for this application
    const appName = application.name.toLowerCase()
    const config = Object.keys(webAccessConfig).find(key => appName.includes(key))
    
    if (!config) {
      return NextResponse.json({
        success: true,
        hasWebAccess: false,
        message: 'This application does not have a web interface'
      })
    }

    const webConfig = webAccessConfig[config]
    
    // Find the mapped port for web access
    let webPort = null
    for (const [hostPort, containerPort] of Object.entries(ports)) {
      if (containerPort === webConfig.defaultPort) {
        webPort = hostPort
        break
      }
    }

    if (!webPort) {
      return NextResponse.json({
        success: true,
        hasWebAccess: false,
        message: `Web interface port ${webConfig.defaultPort} not exposed`
      })
    }

    const webUrl = `${webConfig.protocol}://localhost:${webPort}${webConfig.path}`

    return NextResponse.json({
      success: true,
      hasWebAccess: true,
      webUrl: webUrl,
      port: webPort,
      protocol: webConfig.protocol,
      path: webConfig.path,
      requiresAuth: webConfig.requiresAuth || false,
      defaultCredentials: webConfig.defaultCredentials || null,
      applicationName: application.name,
      ports: ports
    })

  } catch (error: any) {
    console.error('Web access API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get web access information' 
      },
      { status: 500 }
    )
  }
} 