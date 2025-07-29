"use client"

import { useEffect, useState } from "react"
import { Activity, Cpu, HardDrive, MemoryStick, Thermometer, Zap, Clock, Server, Eye, EyeOff } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface ServerMonitoringData {
  id: number
  name: string
  host: string | null
  online: boolean
  cpuUsage: number
  ramUsage: number
  diskUsage: number
  gpuUsage: number
  temp: number
  uptime: string
  monitoring: boolean
  ip: string
  lastUpdated: string
}

interface MonitoringResponse {
  servers: ServerMonitoringData[]
  totalServers: number
  timestamp: string
}

export function GlancesMonitorWidget() {
  const t = useTranslations('Common')
  const [monitoringData, setMonitoringData] = useState<ServerMonitoringData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>("")
  const [allServers, setAllServers] = useState<ServerMonitoringData[]>([])
  const [showDebug, setShowDebug] = useState(false)

  const fetchMonitoringData = async () => {
    try {
      const response = await fetch('/api/servers/monitoring')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data: MonitoringResponse = await response.json()
      
      // Debug: Log filtered results
      console.log(`Server Monitor: Found ${data.servers.length} total servers, ${data.servers.filter(s => s.monitoring).length} with monitoring enabled`)
      
      // Store all servers for debug purposes
      setAllServers(data.servers)
      
      // Show all servers with monitoring enabled (both physical and virtual)
      const monitoredServers = data.servers.filter(server => server.monitoring)
      console.log('Filtered monitored servers to display:', monitoredServers)
      
      setMonitoringData(monitoredServers)
      setLastUpdated(data.timestamp)
      setError(null)
    } catch (err) {
      console.error('Failed to fetch monitoring data:', err)
      setError('Failed to load monitoring data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMonitoringData()
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const getUsageColor = (usage: number) => {
    if (usage >= 90) return "text-red-500"
    if (usage >= 75) return "text-yellow-500"
    return "text-green-500"
  }

  const getProgressColor = (usage: number) => {
    if (usage >= 90) return "bg-red-500"
    if (usage >= 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getTempColor = (temp: number) => {
    if (temp >= 80) return "text-red-500"
    if (temp >= 65) return "text-yellow-500"
    return "text-blue-500"
  }

  const formatUptime = (uptime: string) => {
    if (!uptime || uptime === "0m") return "N/A"
    return uptime
  }

  if (loading) {
    return (
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <Skeleton className="h-6 w-48" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="modern-card border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Activity className="h-5 w-5" />
            Glances Monitor - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (monitoringData.length === 0) {
    return (
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center py-8">
              <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No monitored servers found</p>
              <p className="text-sm text-muted-foreground mt-2">
                Servers need "Monitoring = true" to appear here
              </p>
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={() => setShowDebug(!showDebug)} 
                variant="outline" 
                size="sm"
                className="w-full"
              >
                {showDebug ? 'Hide' : 'Show'} Debug Information
              </Button>
              
              {showDebug && (
                <div className="bg-muted p-4 rounded-lg text-sm space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">All Servers from API ({allServers.length}):</h4>
                    {allServers.length === 0 ? (
                      <p className="text-muted-foreground">No servers found in database</p>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {allServers.map(server => (
                          <div key={server.id} className="bg-background p-2 rounded border text-xs">
                            <div><strong>Name:</strong> {server.name}</div>
                            <div><strong>ID:</strong> {server.id}</div>
                            <div><strong>Host:</strong> {server.host ? '✓ true' : '✗ false'}</div>
                            <div><strong>Monitoring:</strong> {server.monitoring ? '✓ true' : '✗ false'}</div>
                            <div><strong>Online:</strong> {server.online ? '✓ true' : '✗ false'}</div>
                            <div><strong>IP:</strong> {server.ip || 'Not set'}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                                     <div>
                     <h4 className="font-semibold mb-2">Monitoring Filtering Results:</h4>
                     <p>• Physical servers (host=true): {allServers.filter(s => s.host).length}</p>
                     <p>• <strong>Servers with monitoring enabled: {allServers.filter(s => s.monitoring).length}</strong></p>
                     <p>• Both physical + monitoring: {allServers.filter(s => s.host && s.monitoring).length}</p>
                     <p className="text-xs text-muted-foreground mt-2">
                       All servers with "monitoring=true" will be displayed (physical and virtual)
                     </p>
                   </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="modern-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Monitor
          </div>
          <Badge variant="outline" className="text-xs">
            {monitoringData.length} Server{monitoringData.length !== 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        {lastUpdated && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {monitoringData.map((server) => (
          <div key={server.id} className="space-y-4 p-4 rounded-lg border bg-card/50">
            {/* Server Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${server.online ? 'bg-green-500' : 'bg-red-500'}`} />
                <div>
                  <h3 className="font-semibold">{server.name}</h3>
                  <p className="text-sm text-muted-foreground">{server.ip}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {server.online ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    <Eye className="w-3 h-3 mr-1" />
                    Online
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Offline
                  </Badge>
                )}
              </div>
            </div>

            {server.online && (
              <>
                {/* System Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* CPU Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-blue-500" />
                        <span className="text-sm font-medium">CPU</span>
                      </div>
                      <span className={`text-sm font-semibold ${getUsageColor(server.cpuUsage)}`}>
                        {server.cpuUsage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={server.cpuUsage} 
                      className="h-2"
                      style={{
                        '--progress-background': getProgressColor(server.cpuUsage)
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* RAM Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MemoryStick className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium">RAM</span>
                      </div>
                      <span className={`text-sm font-semibold ${getUsageColor(server.ramUsage)}`}>
                        {server.ramUsage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={server.ramUsage} 
                      className="h-2"
                      style={{
                        '--progress-background': getProgressColor(server.ramUsage)
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* Disk Usage */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-orange-500" />
                        <span className="text-sm font-medium">Disk</span>
                      </div>
                      <span className={`text-sm font-semibold ${getUsageColor(server.diskUsage)}`}>
                        {server.diskUsage.toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={server.diskUsage} 
                      className="h-2"
                      style={{
                        '--progress-background': getProgressColor(server.diskUsage)
                      } as React.CSSProperties}
                    />
                  </div>

                  {/* GPU Usage */}
                  {server.gpuUsage > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-green-500" />
                          <span className="text-sm font-medium">GPU</span>
                        </div>
                        <span className={`text-sm font-semibold ${getUsageColor(server.gpuUsage)}`}>
                          {server.gpuUsage.toFixed(1)}%
                        </span>
                      </div>
                      <Progress 
                        value={server.gpuUsage} 
                        className="h-2"
                        style={{
                          '--progress-background': getProgressColor(server.gpuUsage)
                        } as React.CSSProperties}
                      />
                    </div>
                  )}
                </div>

                {/* Additional Information */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-4">
                    {/* Temperature */}
                    {server.temp > 0 && (
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <span className={`text-sm font-medium ${getTempColor(server.temp)}`}>
                          {server.temp.toFixed(1)}°C
                        </span>
                      </div>
                    )}
                    
                    {/* Uptime */}
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-muted-foreground">
                        {formatUptime(server.uptime)}
                      </span>
                    </div>
                  </div>

                  {/* Resource Usage Summary */}
                  <div className="text-xs text-muted-foreground">
                    Avg: {((server.cpuUsage + server.ramUsage + server.diskUsage) / 3).toFixed(1)}%
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
} 