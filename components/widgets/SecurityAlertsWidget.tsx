"use client"

import { useEffect, useState } from "react"
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react"

interface SecurityAlert {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  message: string
  timestamp: Date
}

export function SecurityAlertsWidget() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate security alerts data
    const mockAlerts: SecurityAlert[] = [
      {
        id: '1',
        type: 'success',
        message: 'All security scans passed',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        id: '2',
        type: 'warning',
        message: 'SSL certificate expires in 30 days',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      },
      {
        id: '3',
        type: 'info',
        message: 'Failed login attempt from 192.168.1.100',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
      }
    ]
    
    setAlerts(mockAlerts)
    setLoading(false)
  }, [])

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Shield className="h-4 w-4 text-blue-500" />
    }
  }

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="modern-card animate-pulse">
        <div className="p-6">
          <div className="h-6 bg-muted rounded mb-4"></div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
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
            <h3 className="text-xl font-semibold">Security Alerts</h3>
            <p className="text-sm text-muted-foreground mt-1">Recent security events</p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Shield className="h-6 w-6 text-foreground" />
          </div>
        </div>
        
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No security alerts</p>
              <p className="text-sm text-muted-foreground mt-2">All systems secure</p>
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}>
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {getAlertIcon(alert.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatTimestamp(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Security Status:</span>
              <span className="font-medium text-green-600">Protected</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 