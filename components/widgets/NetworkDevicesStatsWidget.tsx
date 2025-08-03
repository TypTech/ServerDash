"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Network } from "lucide-react"
import { useTranslations } from "next-intl"

interface StatsResponse {
  networkDeviceCount: number
  onlineNetworkDevicesCount: number
}

export function NetworkDevicesStatsWidget() {
  const t = useTranslations('Dashboard')
  const [networkDeviceCount, setNetworkDeviceCount] = useState<number>(0)
  const [onlineNetworkDeviceCount, setOnlineNetworkDeviceCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const getStats = async () => {
    try {
      const response = await axios.post<StatsResponse>("/api/dashboard/get", {})
      setNetworkDeviceCount(response.data.networkDeviceCount)
      setOnlineNetworkDeviceCount(response.data.onlineNetworkDevicesCount)
    } catch (error: any) {
      console.error('Failed to fetch network device stats:', error)
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
            <h3 className="text-xl font-semibold">Network Devices</h3>
            <p className="text-sm text-muted-foreground mt-1">Monitor your network infrastructure</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Network className="h-6 w-6 text-foreground" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-3">{networkDeviceCount}</div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="status-dot"></div>
            <p className="text-sm text-muted-foreground">Online Devices</p>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Devices</span>
              <span className="text-lg font-semibold">{onlineNetworkDeviceCount}</span>
            </div>
          </div>
        </div>
        
        <Link href="/dashboard/network-devices" className="minimal-button w-full flex items-center justify-center space-x-2">
          <span>View All Devices</span>
          <div className="status-dot"></div>
        </Link>
      </div>
    </div>
  )
} 