"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Layers } from "lucide-react"
import { useTranslations } from "next-intl"

interface StatsResponse {
  virtualMachineCount: number
  onlineVirtualMachinesCount: number
}

export function VirtualMachinesStatsWidget() {
  const t = useTranslations('Dashboard')
  const [virtualMachineCount, setVirtualMachineCount] = useState<number>(0)
  const [onlineVirtualMachinesCount, setOnlineVirtualMachinesCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  const getStats = async () => {
    try {
      const response = await axios.post<StatsResponse>("/api/dashboard/get", {})
      setVirtualMachineCount(response.data.virtualMachineCount)
      setOnlineVirtualMachinesCount(response.data.onlineVirtualMachinesCount)
    } catch (error: any) {
      console.error('Failed to fetch virtual machine stats:', error)
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
            <h3 className="text-xl font-semibold">{t('VirtualMachines.Title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('VirtualMachines.Description')}</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Layers className="h-6 w-6 text-foreground" />
          </div>
        </div>
        
        <div className="text-center mb-6">
          <div className="text-4xl font-bold mb-3">{virtualMachineCount}</div>
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="status-dot"></div>
            <p className="text-sm text-muted-foreground">{t('VirtualMachines.OnlineVirtualMachines')}</p>
          </div>
          
          <div className="metric-card">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Active Services</span>
              <span className="text-lg font-semibold">{onlineVirtualMachinesCount}</span>
            </div>
          </div>
        </div>
        
        <Link href="/dashboard/virtual-machines" className="minimal-button w-full flex items-center justify-center space-x-2">
          <span>{t('VirtualMachines.ViewAllVirtualMachines')}</span>
          <div className="status-dot"></div>
        </Link>
      </div>
    </div>
  )
} 