"use client"

import { useEffect, useState } from "react"
import { Download, RefreshCw, CheckCircle, AlertTriangle, XCircle, Terminal, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

interface SystemInfo {
  os: string
  kernel: string
  architecture: string
  uptime: string
  packageManager: string
}

interface UpdateInfo {
  total: number
  security: number
  updates: string[]
  lastChecked: string
}

interface UpdateStatus {
  checking: boolean
  updating: boolean
  lastUpdate: string
  error?: string
}

export function SystemUpdatesWidget() {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null)
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null)
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>({
    checking: false,
    updating: false,
    lastUpdate: ""
  })
  const [loading, setLoading] = useState(true)

  const fetchSystemInfo = async () => {
    try {
      const response = await fetch('/api/system/info')
      if (response.ok) {
        const data = await response.json()
        setSystemInfo(data)
      }
    } catch (error) {
      console.error('Failed to fetch system info:', error)
    }
  }

  const fetchUpdateInfo = async () => {
    try {
      setUpdateStatus(prev => ({ ...prev, checking: true, error: undefined }))
      const response = await fetch('/api/system/updates')
      if (response.ok) {
        const data = await response.json()
        setUpdateInfo(data)
        setUpdateStatus(prev => ({ 
          ...prev, 
          checking: false, 
          lastUpdate: new Date().toISOString() 
        }))
      } else {
        throw new Error('Failed to check for updates')
      }
    } catch (error) {
      console.error('Failed to fetch update info:', error)
      setUpdateStatus(prev => ({ 
        ...prev, 
        checking: false, 
        error: 'Failed to check for updates' 
      }))
      toast.error('Failed to check for system updates')
    }
  }

  const performSystemUpdate = async () => {
    if (!updateInfo || updateInfo.total === 0) return

    try {
      setUpdateStatus(prev => ({ ...prev, updating: true, error: undefined }))
      toast.info('Starting system update...')
      
      const response = await fetch('/api/system/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
      
      if (response.ok) {
        const result = await response.json()
        toast.success('System update completed successfully')
        setUpdateStatus(prev => ({ 
          ...prev, 
          updating: false,
          lastUpdate: new Date().toISOString()
        }))
        // Refresh update info after successful update
        setTimeout(fetchUpdateInfo, 2000)
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      console.error('Failed to perform system update:', error)
      setUpdateStatus(prev => ({ 
        ...prev, 
        updating: false, 
        error: 'System update failed' 
      }))
      toast.error('System update failed')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([fetchSystemInfo(), fetchUpdateInfo()])
      setLoading(false)
    }
    
    loadData()
    
    // Auto-refresh every 30 minutes
    const interval = setInterval(fetchUpdateInfo, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getUpdateStatusColor = () => {
    if (updateStatus.updating) return "text-blue-500"
    if (updateStatus.error) return "text-red-500"
    if (!updateInfo) return "text-gray-500"
    if (updateInfo.total === 0) return "text-green-500"
    if (updateInfo.security > 0) return "text-red-500"
    return "text-yellow-500"
  }

  const getUpdateStatusIcon = () => {
    if (updateStatus.updating || updateStatus.checking) return <RefreshCw className="h-4 w-4 animate-spin" />
    if (updateStatus.error) return <XCircle className="h-4 w-4" />
    if (!updateInfo) return <Info className="h-4 w-4" />
    if (updateInfo.total === 0) return <CheckCircle className="h-4 w-4" />
    if (updateInfo.security > 0) return <AlertTriangle className="h-4 w-4" />
    return <Download className="h-4 w-4" />
  }

  const formatLastChecked = (timestamp: string) => {
    if (!timestamp) return "Never"
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      
      if (diffMins < 1) return "Just now"
      if (diffMins < 60) return `${diffMins}m ago`
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
      return `${Math.floor(diffMins / 1440)}d ago`
    } catch {
      return "Unknown"
    }
  }

  if (loading) {
    return (
      <div className="modern-card animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded"></div>
            ))}
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
            <h3 className="text-xl font-semibold">System Updates</h3>
            <p className="text-sm text-muted-foreground mt-1">System information and updates</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Terminal className="h-6 w-6 text-foreground" />
          </div>
        </div>

        {/* System Information */}
        {systemInfo && (
          <div className="mb-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="text-sm font-medium mb-3">System Information</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">OS:</span>
                <span className="ml-2 font-medium">{systemInfo.os}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Kernel:</span>
                <span className="ml-2 font-medium">{systemInfo.kernel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Architecture:</span>
                <span className="ml-2 font-medium">{systemInfo.architecture}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Package Manager:</span>
                <span className="ml-2 font-medium">{systemInfo.packageManager}</span>
              </div>
            </div>
          </div>
        )}

        {/* Update Status */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={getUpdateStatusColor()}>
                {getUpdateStatusIcon()}
              </div>
              <span className="font-medium">
                {updateStatus.updating ? "Updating..." :
                 updateStatus.checking ? "Checking for updates..." :
                 updateStatus.error ? "Update check failed" :
                 !updateInfo ? "No update information" :
                 updateInfo.total === 0 ? "System up to date" :
                 `${updateInfo.total} updates available`}
              </span>
            </div>
            
            <Button
              onClick={fetchUpdateInfo}
              size="sm"
              variant="outline"
              disabled={updateStatus.checking || updateStatus.updating}
              className="gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${updateStatus.checking ? 'animate-spin' : ''}`} />
              Check
            </Button>
          </div>

          {updateInfo && updateInfo.total > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  {updateInfo.security > 0 && (
                    <Badge variant="destructive" className="text-xs">
                      {updateInfo.security} Security
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {updateInfo.total - updateInfo.security} Regular
                  </Badge>
                </div>
                <Button
                  onClick={performSystemUpdate}
                  size="sm"
                  disabled={updateStatus.updating}
                  className="gap-1"
                >
                  {updateStatus.updating ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  {updateStatus.updating ? "Updating..." : "Update System"}
                </Button>
              </div>

              {updateStatus.updating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Update Progress</span>
                    <span>Running...</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Update History */}
        <div className="text-sm text-muted-foreground space-y-1">
          <div className="flex justify-between">
            <span>Last checked:</span>
            <span>{formatLastChecked(updateInfo?.lastChecked || updateStatus.lastUpdate)}</span>
          </div>
          {updateStatus.lastUpdate && (
            <div className="flex justify-between">
              <span>Last updated:</span>
              <span>{formatLastChecked(updateStatus.lastUpdate)}</span>
            </div>
          )}
        </div>

        {updateStatus.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{updateStatus.error}</p>
          </div>
        )}
      </div>
    </div>
  )
} 