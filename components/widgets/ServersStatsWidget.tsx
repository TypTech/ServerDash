"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Server } from "lucide-react"
import { useTranslations } from "next-intl"

interface StatsResponse {
  serverCount: number
  onlineServersCount: number
}

export function ServersStatsWidget() {
  const t = useTranslations('Dashboard')
  const [serverCount, setServerCount] = useState<number>(0)
  const [onlineServersCount, setOnlineServersCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const getStats = async () => {
    try {
      const response = await axios.post<StatsResponse>("/api/dashboard/get", {})
      setServerCount(response.data.serverCount)
      setOnlineServersCount(response.data.onlineServersCount)
    } catch (error: any) {
      console.error('Failed to fetch server stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getStats()
    // Refresh every 30 seconds
    const interval = setInterval(getStats, 30000)
    return () => clearInterval(interval)
  }, [])

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

  return (
    <div className="modern-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">{t('Servers.Title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('Servers.Description')}</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Server className="h-6 w-6 text-foreground" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-3">{serverCount}</div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="status-dot"></div>
            <p className="text-sm text-muted-foreground">{t('Servers.OnlineServers')}</p>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Servers</span>
              <span className="text-lg font-semibold">{onlineServersCount}</span>
            </div>
          </div>
        </div>
        
        <Link href="/dashboard/servers" className="minimal-button w-full flex items-center justify-center space-x-2">
          <span>{t('Servers.ViewAllServers')}</span>
          <div className="status-dot"></div>
        </Link>
      </div>
    </div>
  )
} 