"use client"

import { useEffect, useState } from "react"
import { Clock, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface UptimeData {
  uptime: string
  uptimeSeconds: number
  bootTime: string
  systemLoad: number
  uptimeHistory: {
    last24h: number
    last7d: number
    last30d: number
  }
}

export function UptimeMonitorWidget() {
  const [uptimeData, setUptimeData] = useState<UptimeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchUptime = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setRefreshing(true)
      }
      setError(null)
      
      const response = await fetch('/api/system/stats')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setUptimeData({
            uptime: data.uptime,
            uptimeSeconds: data.uptimeSeconds,
            bootTime: data.bootTime,
            systemLoad: data.systemLoad,
            uptimeHistory: data.uptimeHistory
          })
        } else {
          throw new Error(data.error || 'Failed to fetch uptime')
        }
      } else {
        throw new Error('Failed to fetch uptime')
      }
    } catch (err: any) {
      console.error('Failed to fetch uptime:', err)
      setError(err.message || 'Failed to load uptime')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchUptime()
    
    // Update every minute
    const interval = setInterval(() => fetchUptime(), 60000)
    return () => clearInterval(interval)
  }, [])

  const formatBootTime = (bootTime: string) => {
    if (!bootTime) return "Unknown"
    try {
      return new Date(bootTime).toLocaleString()
    } catch {
      return "Unknown"
    }
  }

  const getUptimeDays = () => {
    if (!uptimeData) return 0
    return Math.floor(uptimeData.uptimeSeconds / (24 * 60 * 60))
  }

  if (loading) {
    return (
      <div className="modern-card animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="h-12 bg-muted rounded mb-4"></div>
          <div className="h-8 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="modern-card">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold">Server Uptime</h3>
              <p className="text-sm text-muted-foreground mt-1">Server availability status</p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
              <Clock className="h-6 w-6 text-foreground" />
            </div>
          </div>
          <div className="text-center py-8">
            <p className="text-red-500 mb-2">Failed to load uptime</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => fetchUptime(true)} 
              size="sm" 
              variant="outline" 
              className="mt-4"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (!uptimeData) {
    return (
      <div className="modern-card">
        <div className="p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No uptime data available</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">Server Uptime</h3>
            <p className="text-sm text-muted-foreground mt-1">Server availability status</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => fetchUptime(true)}
              size="sm"
              variant="outline"
              disabled={refreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
              <Clock className="h-6 w-6 text-foreground" />
            </div>
          </div>
        </div>
        
        {/* Main Uptime Display */}
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-3 text-primary">{uptimeData.uptime}</div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-sm text-muted-foreground">
              Server Running ({getUptimeDays()} days)
            </p>
          </div>
          
          {/* System Load Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-muted text-sm">
            <span className="font-medium">Load: {uptimeData.systemLoad.toFixed(1)}%</span>
          </div>
        </div>

        {/* Uptime Statistics */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last 24h uptime:</span>
            <span className="font-medium text-green-600">{uptimeData.uptimeHistory.last24h}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last 7d uptime:</span>
            <span className="font-medium text-green-600">{uptimeData.uptimeHistory.last7d}%</span>
          </div>
          <div className="flex justify-between text-sm border-t pt-3">
            <span className="text-muted-foreground">System started:</span>
            <span className="font-medium text-xs">{formatBootTime(uptimeData.bootTime)}</span>
          </div>
        </div>
      </div>
    </div>
  )
} 