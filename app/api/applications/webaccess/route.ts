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
  'elasticsearch': { defaultPort: '9200', path: '/', protocol: 'http' },
  // New applications with web interfaces
  'plex': { defaultPort: '32400', path: '/web', protocol: 'http', requiresAuth: true },
  'code': { defaultPort: '8080', path: '/', protocol: 'http', requiresAuth: true },
  'jellyfin': { defaultPort: '8096', path: '/', protocol: 'http' },
  'home': { defaultPort: '8123', path: '/', protocol: 'http' },
  'wordpress': { defaultPort: '80', path: '/', protocol: 'http' },
  'pi-hole': { defaultPort: '80', path: '/admin', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'admin123' } },
  'pihole': { defaultPort: '80', path: '/admin', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'admin123' } },
  'bitwarden': { defaultPort: '80', path: '/', protocol: 'http' },
  'vaultwarden': { defaultPort: '80', path: '/', protocol: 'http' },
  'sonarr': { defaultPort: '8989', path: '/', protocol: 'http' },
  'radarr': { defaultPort: '7878', path: '/', protocol: 'http' },
  'qbittorrent': { defaultPort: '8080', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'adminadmin' } },
  'uptime': { defaultPort: '3001', path: '/', protocol: 'http' },
  'kuma': { defaultPort: '3001', path: '/', protocol: 'http' },
  'filebrowser': { defaultPort: '80', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'admin' } },
  'gitea': { defaultPort: '3000', path: '/', protocol: 'http' },
  'photoprism': { defaultPort: '2342', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'insecure' } },
  'yacht': { defaultPort: '8000', path: '/', protocol: 'http' },
  // Additional applications
  'syncthing': { defaultPort: '8384', path: '/', protocol: 'http' },
  'plausible': { defaultPort: '8000', path: '/', protocol: 'http' },
  'netdata': { defaultPort: '19999', path: '/', protocol: 'http' },
  'mattermost': { defaultPort: '8065', path: '/', protocol: 'http' },
  'bookstack': { defaultPort: '80', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin@admin.com', password: 'password' } },
  'minio': { defaultPort: '9001', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'minioadmin', password: 'minioadmin' } },
  'umami': { defaultPort: '3000', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'umami' } },
  'duplicati': { defaultPort: '8200', path: '/', protocol: 'http' },
  'rocket': { defaultPort: '3000', path: '/', protocol: 'http' },
  'chat': { defaultPort: '3000', path: '/', protocol: 'http' },
  'influxdb': { defaultPort: '8086', path: '/', protocol: 'http', requiresAuth: true, defaultCredentials: { username: 'admin', password: 'password123' } }
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