"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import Link from "next/link"
import { Activity, Layers, Network, Server } from "lucide-react"

import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

import { useTranslations } from "next-intl"

interface StatsResponse {
  serverCountNoVMs: number
  serverCountOnlyVMs: number
  applicationCount: number
  onlineApplicationsCount: number
  networkDeviceCount: number
  onlineNetworkDeviceCount: number
}

export default function Dashboard() {
  const t = useTranslations('Dashboard')
  const [serverCountNoVMs, setServerCountNoVMs] = useState<number>(0)
  const [serverCountOnlyVMs, setServerCountOnlyVMs] = useState<number>(0)
  const [applicationCount, setApplicationCount] = useState<number>(0)
  const [onlineApplicationsCount, setOnlineApplicationsCount] = useState<number>(0)
  const [networkDeviceCount, setNetworkDeviceCount] = useState<number>(0)
  const [onlineNetworkDeviceCount, setOnlineNetworkDeviceCount] = useState<number>(0)

  const getStats = async () => {
    try {
      const response = await axios.post<StatsResponse>("/api/dashboard/get", {})
      setServerCountNoVMs(response.data.serverCountNoVMs)
      setServerCountOnlyVMs(response.data.serverCountOnlyVMs)
      setApplicationCount(response.data.applicationCount)
      setOnlineApplicationsCount(response.data.onlineApplicationsCount)
      setNetworkDeviceCount(response.data.networkDeviceCount)
      setOnlineNetworkDeviceCount(response.data.onlineNetworkDeviceCount)
    } catch (error: any) {
      console.log("Axios error:", error.response?.data)
    }
  }

  useEffect(() => {
    getStats()
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-6">
            <SidebarTrigger className="-ml-1 hover:bg-muted transition-all duration-200" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage className="text-muted-foreground">/</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">{t('Title')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-8 subtle-grid">
          <div className="relative mb-12">
            <h1 className="title-large clean-gradient mb-4">{t('Title')}</h1>
            <p className="subtitle max-w-2xl">
              Monitor your infrastructure with modern, clean design and real-time insights
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
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
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {/* Physical Servers */}
                  <div className="metric-card">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
                        <Server className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{serverCountNoVMs}</div>
                        <p className="text-xs text-muted-foreground">{t('Servers.PhysicalServers')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Applications */}
                  <div className="metric-card">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted text-foreground">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{applicationCount}</div>
                        <p className="text-xs text-muted-foreground">{t('VirtualMachines.Title')}</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <Link href="/dashboard/servers" className="minimal-button w-full flex items-center justify-center space-x-2">
                  <span>{t('Servers.ManageInfrastructure')}</span>
                  <div className="status-dot"></div>
                </Link>
              </div>
            </div>

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
                  <div className="text-4xl font-bold mb-3">{applicationCount}</div>
                  <div className="flex items-center justify-center space-x-2 mb-4">
                    <div className="status-dot"></div>
                    <p className="text-sm text-muted-foreground">{t('VirtualMachines.OnlineVirtualMachines')}</p>
                  </div>
                  
                  <div className="metric-card">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Active Services</span>
                      <span className="text-lg font-semibold">{onlineApplicationsCount}</span>
                    </div>
                  </div>
                </div>
                
                <Link href="/dashboard/applications" className="minimal-button w-full flex items-center justify-center space-x-2">
                  <span>{t('VirtualMachines.ViewAllVirtualMachines')}</span>
                  <div className="status-dot"></div>
                </Link>
              </div>
            </div>

            <div className="modern-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{t('Uptime.Title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('Uptime.Description')}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                    <Activity className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-3xl font-bold">
                      {onlineApplicationsCount}/{applicationCount}
                    </span>
                    <div className="flex items-center bg-muted px-3 py-1 rounded-lg text-sm font-semibold">
                      {applicationCount > 0 ? Math.round((onlineApplicationsCount / applicationCount) * 100) : 0}%
                    </div>
                  </div>
                  <div className="progress-modern">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${applicationCount > 0 ? Math.round((onlineApplicationsCount / applicationCount) * 100) : 0}%`,
                      }}
                    ></div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{t('Uptime.OnlineVirtualMachines')}</p>
                </div>
                
                <Link href="/dashboard/uptime" className="minimal-button w-full flex items-center justify-center space-x-2">
                  <span>{t('Uptime.ViewUptimeMetrics')}</span>
                  <div className="status-dot"></div>
                </Link>
              </div>
            </div>

            <div className="modern-card">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold">{t('Network.Title')}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{t('Network.Description')}</p>
                  </div>
                  <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-muted">
                    <Network className="h-6 w-6 text-foreground" />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-3xl font-bold mb-2">{networkDeviceCount}</div>
                  <p className="text-sm text-muted-foreground">{t('Network.NetworkDevices')}</p>
                </div>
                
                <Link href="/dashboard/network-devices" className="minimal-button w-full flex items-center justify-center space-x-2">
                  <span>{t('Network.ViewNetworkDetails')}</span>
                  <div className="status-dot"></div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
