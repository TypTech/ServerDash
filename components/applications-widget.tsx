"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Package, Play, Square } from "lucide-react"
import { useTranslations } from "next-intl"

interface Application {
  id: number
  name: string
  description?: string
  icon?: string
  category: string
  dockerImage: string
  ports?: string
  environment?: string
  volumes?: string
  commands?: string
  deployed: boolean
  status: string
  containerId?: string
  featured: boolean
  tags?: string
  version: string
  author?: string
  website?: string
  documentation?: string
  createdAt: Date
  updatedAt: Date
}

interface ApiResponse {
  success: boolean
  applications?: Application[]
  maxPage?: number
  totalItems?: number
  error?: string
}

export function ApplicationsWidget() {
  const t = useTranslations('Dashboard')
  const [applicationCount, setApplicationCount] = useState<number>(0)
  const [runningApplicationsCount, setRunningApplicationsCount] = useState<number>(0)
  const [recentApplications, setRecentApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

  const fetchApplicationsData = async () => {
    try {
      // Get recent deployed applications for display
      const response = await axios.post<ApiResponse>('/api/applications/get', {
        page: 1,
        ITEMS_PER_PAGE: 3,
        deployed: true
      })
      
      if (response.data.success && response.data.applications) {
        setRecentApplications(response.data.applications)
      }
    } catch (error) {
      console.error('Failed to fetch applications data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.post<{
        applicationCount: number
        runningApplicationsCount: number
      }>("/api/dashboard/get", {})
      setApplicationCount(response.data.applicationCount || 0)
      setRunningApplicationsCount(response.data.runningApplicationsCount || 0)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
    }
  }

  useEffect(() => {
    Promise.all([
      fetchApplicationsData(),
      fetchDashboardStats()
    ])
  }, [])

  return (
    <div className="modern-card">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold">{t('Applications.Title')}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Deployed container applications
            </p>
          </div>
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
            <Package className="h-6 w-6 text-foreground" />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold">{applicationCount}</span>
            <div className="flex items-center bg-muted px-3 py-1 rounded-lg text-sm font-semibold">
              <Play className="h-3 w-3 mr-1 text-green-600" />
              {runningApplicationsCount}
            </div>
          </div>
          
          <div className="metric-card mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Running Applications</span>
              <span className="text-lg font-semibold">{runningApplicationsCount}/{applicationCount}</span>
            </div>
          </div>

          {/* Recent Applications List */}
          {!loading && recentApplications.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Recent Applications</h4>
              {recentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {app.icon ? (
                      <span className="text-lg">{app.icon}</span>
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {app.status === 'running' ? (
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 ml-1">Running</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Square className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground ml-1">Stopped</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && recentApplications.length === 0 && (
            <div className="text-center py-4">
              <Package className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No applications deployed yet</p>
            </div>
          )}
        </div>
        
        <Link href="/dashboard/applications" className="minimal-button w-full flex items-center justify-center space-x-2">
          <span>Manage Applications</span>
          <div className="status-dot"></div>
        </Link>
      </div>
    </div>
  )
} 