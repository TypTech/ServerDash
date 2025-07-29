import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const webAccessConfig: Record<string, { 
  defaultPort: string, 
  path: string, 
  protocol: string 
}> = {
  'grafana': { defaultPort: '3000', path: '/', protocol: 'http' },
  'portainer': { defaultPort: '9000', path: '/', protocol: 'http' },
  'nginx': { defaultPort: '80', path: '/', protocol: 'http' },
  'apache': { defaultPort: '80', path: '/', protocol: 'http' },
  'nextcloud': { defaultPort: '80', path: '/', protocol: 'http' },
  'traefik': { defaultPort: '8080', path: '/', protocol: 'http' },
  'prometheus': { defaultPort: '9090', path: '/', protocol: 'http' },
  'elasticsearch': { defaultPort: '9200', path: '/', protocol: 'http' }
}

export async function GET() {
  try {
    // Get all running applications
    const runningApps = await (prisma as any).application.findMany({
      where: { 
        deployed: true,
        status: 'running'
      }
    })

    const quickAccessList = runningApps.map((app: any) => {
      let webUrl = null
      let ports: Record<string, string> = {}
      
      // Parse ports
      if (app.ports) {
        try {
          ports = JSON.parse(app.ports)
        } catch (error) {
          console.error('Failed to parse ports:', error)
        }
      }

      // Check if app has web access
      const appName = app.name.toLowerCase()
      const config = Object.keys(webAccessConfig).find(key => appName.includes(key))
      
      if (config) {
        const webConfig = webAccessConfig[config]
        // Find the mapped port for web access
        for (const [hostPort, containerPort] of Object.entries(ports)) {
          if (containerPort === webConfig.defaultPort) {
            webUrl = `${webConfig.protocol}://localhost:${hostPort}${webConfig.path}`
            break
          }
        }
      }

      return {
        id: app.id,
        name: app.name,
        icon: app.icon,
        status: app.status,
        containerId: app.containerId,
        webUrl: webUrl,
        terminalCommand: `docker exec -it ${app.containerId} /bin/sh`,
        ports: Object.entries(ports).map(([host, container]) => `${host}→${container}`)
      }
    })

    return NextResponse.json({
      success: true,
      runningApplications: quickAccessList.length,
      applications: quickAccessList
    })

  } catch (error: any) {
    console.error('Quick access API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Failed to get quick access information' 
      },
      { status: 500 }
    )
  }
} 