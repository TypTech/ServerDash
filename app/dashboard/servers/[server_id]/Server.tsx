"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import axios from "axios"
import Chart from 'chart.js/auto'
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Link, Cpu, MicroscopeIcon as Microchip, MemoryStick, HardDrive, MonitorIcon as MonitorCog, FileDigit, History } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusIndicator } from "@/components/status-indicator"
import { DynamicIcon } from "lucide-react/dynamic"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import NextLink from "next/link"
import { useTranslations } from "next-intl"

interface ServerHistory {
  labels: string[];
  datasets: {
    cpu: (number | null)[];
    ram: (number | null)[];
    disk: (number | null)[];
    online: (boolean | null)[];
    gpu: (number | null)[];
    temp: (number | null)[];
  }
}

interface Server {
  id: number;
  name: string;
  icon: string;
  host: boolean;
  hostServer: number | null;
  os?: string;
  ip?: string;
  url?: string;
  cpu?: string;
  gpu?: string;
  ram?: string;
  disk?: string;
  hostedVMs?: Server[];
  isVM?: boolean;
  monitoring?: boolean;
  monitoringURL?: string;
  online?: boolean;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  gpuUsage: number;
  temp: number;
  history?: ServerHistory;
  port: number;
  uptime?: string;
}

interface GetServersResponse {
  servers: Server[];
  maxPage: number;
}

export default function ServerDetail() {
  const t = useTranslations()
  const params = useParams()
  const serverId = params.server_id as string
  const [server, setServer] = useState<Server | null>(null)
  const [timeRange, setTimeRange] = useState<'1h' | '1d' | '7d' | '30d'>('1h')
  const [loading, setLoading] = useState(true)
  
  // Chart references
  const cpuChartRef = { current: null as Chart | null }
  const ramChartRef = { current: null as Chart | null }
  const diskChartRef = { current: null as Chart | null }
  const gpuChartRef = { current: null as Chart | null }
  const tempChartRef = { current: null as Chart | null }

  const fetchServerDetails = async () => {
    try {
      setLoading(true)
      const response = await axios.post<GetServersResponse>("/api/servers/get", {
        serverId: parseInt(serverId),
        timeRange: timeRange
      })
      
      if (response.data.servers && response.data.servers.length > 0) {
        setServer(response.data.servers[0])
      }
      setLoading(false)
    } catch (error) {
      console.error("Failed to fetch server details:", error)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchServerDetails()
  }, [serverId, timeRange])

  useEffect(() => {
    if (!server || !server.history) return;

    // Clean up existing charts
    if (cpuChartRef.current) cpuChartRef.current.destroy();
    if (ramChartRef.current) ramChartRef.current.destroy();
    if (diskChartRef.current) diskChartRef.current.destroy();
    if (gpuChartRef.current) gpuChartRef.current.destroy();
    if (tempChartRef.current) tempChartRef.current.destroy();

    // Wait for DOM to be ready
    const initTimer = setTimeout(() => {
      const history = server.history as ServerHistory;
      
      // Format time labels based on the selected time range
      const timeLabels = history.labels.map((date: string) => {
        const d = new Date(date)
        if (timeRange === '1h') {
          return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        } else if (timeRange === '1d') {
          // For 1 day, show hours and minutes
          return d.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        } else if (timeRange === '7d') {
          // For 7 days, show day and time
          return d.toLocaleDateString([], { 
            weekday: 'short',
            month: 'numeric', 
            day: 'numeric' 
          }) + ' ' + d.toLocaleTimeString([], { 
            hour: '2-digit'
          })
        } else {
          // For 30 days
          return d.toLocaleDateString([], { 
            month: 'numeric', 
            day: 'numeric' 
          })
        }
      })
      
      // Create a time range title for the chart
      const getRangeTitle = () => {
        const now = new Date()
        const startDate = new Date(history.labels[0])
        
        if (timeRange === '1h') {
          return `Last Hour (${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        } else if (timeRange === '1d') {
          return `Last 24 Hours (${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
        } else if (timeRange === '7d') {
          return `Last 7 Days (${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })})`
        } else {
          return `Last 30 Days (${startDate.toLocaleDateString([], { month: 'short', day: 'numeric' })} - ${now.toLocaleDateString([], { month: 'short', day: 'numeric' })})`
        }
      }

      // Directly hardcode the y-axis maximum in each chart option
      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'nearest' as const,
          axis: 'x' as const,
          intersect: false
        },
        scales: {
          y: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: {
              stepSize: 25,
              autoSkip: false,
              callback: function(value: any) {
                return value + '%';
              }
            },
            title: {
              display: true,
              text: 'Usage %'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        elements: {
          point: {
            radius: 0
          },
          line: {
            tension: 0.4,
            spanGaps: true
          }
        }
      };

      // Create charts with very explicit y-axis max values
      const cpuCanvas = document.getElementById(`cpu-chart`) as HTMLCanvasElement
      if (cpuCanvas) {
        cpuChartRef.current = new Chart(cpuCanvas, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: t('Common.Server.CPU') + ' ' + t('Common.Server.Usage'),
              data: history.datasets.cpu,
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.1)',
              fill: true,
              spanGaps: false
            }]
          },
          options: {
            ...commonOptions,
            plugins: {
              title: {
                display: true,
                text: t('Common.Server.CPU') + ' ' + t('Server.UsageHistory'),
                font: {
                  size: 14
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems: any) {
                    return timeLabels[tooltipItems[0].dataIndex];
                  }
                }
              },
              legend: {
                display: false
              }
            },
            scales: {
              ...commonOptions.scales,
              y: {
                ...commonOptions.scales.y,
                max: 100  // Force this to ensure it's applied
              }
            }
          }
        })
      }

      const ramCanvas = document.getElementById(`ram-chart`) as HTMLCanvasElement
      if (ramCanvas) {
        ramChartRef.current = new Chart(ramCanvas, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: t('Common.Server.RAM') + ' ' + t('Common.Server.Usage'),
              data: history.datasets.ram,
              borderColor: 'rgb(153, 102, 255)',
              backgroundColor: 'rgba(153, 102, 255, 0.1)',
              fill: true,
              spanGaps: false
            }]
          },
          options: {
            ...commonOptions,
            plugins: {
              title: {
                display: true,
                text: t('Common.Server.RAM') + ' ' + t('Server.UsageHistory'),
                font: {
                  size: 14
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems: any) {
                    return timeLabels[tooltipItems[0].dataIndex];
                  }
                }
              },
              legend: {
                display: false
              }
            },
            scales: {
              ...commonOptions.scales,
              y: {
                ...commonOptions.scales.y,
                max: 100  // Force this to ensure it's applied
              }
            }
          }
        })
      }

      const diskCanvas = document.getElementById(`disk-chart`) as HTMLCanvasElement
      if (diskCanvas) {
        diskChartRef.current = new Chart(diskCanvas, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: t('Common.Server.Disk') + ' ' + t('Common.Server.Usage'),
              data: history.datasets.disk,
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              fill: true,
              spanGaps: false
            }]
          },
          options: {
            ...commonOptions,
            plugins: {
              title: {
                display: true,
                text: t('Common.Server.Disk') + ' ' + t('Server.UsageHistory'),
                font: {
                  size: 14
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems: any) {
                    return timeLabels[tooltipItems[0].dataIndex];
                  }
                }
              },
              legend: {
                display: false
              }
            },
            scales: {
              ...commonOptions.scales,
              y: {
                ...commonOptions.scales.y,
                max: 100  // Force this to ensure it's applied
              }
            }
          }
        })
      }

      const gpuCanvas = document.getElementById(`gpu-chart`) as HTMLCanvasElement
      if (gpuCanvas) {
        gpuChartRef.current = new Chart(gpuCanvas, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: t('Common.Server.GPU') + ' ' + t('Common.Server.Usage'),
              data: history.datasets.gpu,
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.1)',
              fill: true,
              spanGaps: false
            }]
          },
          options: {
            ...commonOptions,
            plugins: {
              title: {
                display: true,
                text: t('Common.Server.GPU') + ' ' + t('Common.Server.UsageHistory'),
                font: {
                  size: 14
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems: any) {
                    return timeLabels[tooltipItems[0].dataIndex];
                  }
                }
              },
              legend: {
                display: false
              }
            },
            scales: {
              ...commonOptions.scales,
              y: {
                ...commonOptions.scales.y,
                max: 100
              }
            }
          }
        })
      }

      const tempCanvas = document.getElementById(`temp-chart`) as HTMLCanvasElement
      if (tempCanvas) {
        tempChartRef.current = new Chart(tempCanvas, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: t('Common.Server.Temperature') + ' ' + t('Common.Server.Usage'),
              data: history.datasets.temp,
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.1)',
              fill: true,
              spanGaps: false
            }]
          },
          options: {
            ...commonOptions,
            plugins: {
              title: {
                display: true,
                text: t('Common.Server.Temperature') + ' ' + t('Server.UsageHistory'),
                font: {
                  size: 14
                }
              },
              tooltip: {
                callbacks: {
                  title: function(tooltipItems: any) {
                    return timeLabels[tooltipItems[0].dataIndex];
                  }
                }
              },
              legend: {
                display: false
              }
            },
            scales: {
              ...commonOptions.scales,
              y: {
                ...commonOptions.scales.y,
                max: 100,
                ticks: {
                  callback: function(value: any) {
                    return value + '°C';
                  }
                }
              }
            }
          }
        })
      }
    }, 100);
    
    return () => {
      clearTimeout(initTimer);
      if (cpuChartRef.current) cpuChartRef.current.destroy();
      if (ramChartRef.current) ramChartRef.current.destroy();
      if (diskChartRef.current) diskChartRef.current.destroy();
      if (gpuChartRef.current) gpuChartRef.current.destroy();
      if (tempChartRef.current) tempChartRef.current.destroy();
    };
  }, [server, timeRange]);

  // Function to refresh data
  const refreshData = () => {
    fetchServerDetails()
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>/</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('Servers.MyInfrastructure')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <NextLink href="/dashboard/servers" className="hover:underline">
                    <BreadcrumbPage>{t('Servers.Title')}</BreadcrumbPage>
                  </NextLink>
                </BreadcrumbItem>
                {server && (
                  <>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{server.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </>
                )}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block" role="status" aria-label="loading">
                <svg
                  className="w-6 h-6 stroke-white animate-spin "
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_9023_61563)">
                    <path
                      d="M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444"
                      stroke="stroke-current"
                      strokeWidth="1.4"
                      strokeLinecap="round"
                      className="my-path"
                    ></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_9023_61563">
                      <rect width="24" height="24" fill="white"></rect>
                    </clipPath>
                  </defs>
                </svg>
                <span className="sr-only">{t('Common.Loading')}</span>
              </div>
            </div>
          ) : server ? (
            <div className="space-y-6">
              {/* Server header card */}
              <Card>
                <CardHeader className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {server.icon && <DynamicIcon name={server.icon as any} size={32} />}
                      <div>
                        <CardTitle className="text-2xl flex items-center gap-2">
                          {server.name}
                        </CardTitle>
                        <CardDescription>
                          {server.os || t('Common.Server.OS')} • {server.isVM ? t('Server.VM') : t('Server.Physical')}
                          {server.isVM && server.hostServer && (
                            <> • {t('Server.HostedOn')} {server.hostedVMs?.[0]?.name}</>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                  </div>
                  {server.monitoring && (
                    <div className="absolute top-0 right-4 flex flex-col items-end">
                      <StatusIndicator isOnline={server.online} />
                      {server.online && server.uptime && (
                        <span className="text-xs text-muted-foreground mt-1 w-max text-right whitespace-nowrap">
                          {t('Common.since', { date: server.uptime })}
                        </span>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">{t('Server.Hardware')}</h3>
                      <div className="grid grid-cols-[120px_1fr] text-sm gap-1">
                        <div className="text-muted-foreground">{t('Common.Server.CPU')}:</div>
                        <div>{server.cpu || "-"}</div>
                        <div className="text-muted-foreground">{t('Common.Server.GPU')}:</div>
                        <div>{server.gpu || "-"}</div>
                        <div className="text-muted-foreground">{t('Common.Server.RAM')}:</div>
                        <div>{server.ram || "-"}</div>
                        <div className="text-muted-foreground">{t('Common.Server.Disk')}:</div>
                        <div>{server.disk || "-"}</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">{t('Server.Network')}</h3>
                      <div className="grid grid-cols-[120px_1fr] text-sm gap-1">
                        <div className="text-muted-foreground">{t('Common.Server.IP')}:</div>
                        <div>{server.ip || "-"}</div>
                        <div className="text-muted-foreground">{t('Server.ManagementURL')}:</div>
                        <div>
                          {server.url ? (
                            <a href={server.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                              {server.url} <Link className="h-3 w-3" />
                            </a>
                          ) : (
                            "-"
                          )}
                        </div>
                      </div>
                    </div>

                    {server.monitoring && (
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">{t('Server.CurrentUsage')}</h3>
                        <div className="grid grid-cols-[120px_1fr] text-sm gap-1">
                          <div className="text-muted-foreground">{t('Common.Server.CPU')}:</div>
                          <div className="flex items-center gap-2">
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${server.cpuUsage > 80 ? "bg-destructive" : server.cpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${server.cpuUsage}%` }}
                              />
                            </div>
                            <span>{server.cpuUsage !== null && server.cpuUsage !== undefined ? `${server.cpuUsage}%` : t('Common.noData')}</span>
                          </div>
                          <div className="text-muted-foreground">{t('Common.Server.RAM')}:</div>
                          <div className="flex items-center gap-2">
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${server.ramUsage > 80 ? "bg-destructive" : server.ramUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${server.ramUsage}%` }}
                              />
                            </div>
                            <span>{server.ramUsage !== null && server.ramUsage !== undefined ? `${server.ramUsage}%` : t('Common.noData')}</span>
                          </div>
                          <div className="text-muted-foreground">{t('Common.Server.Disk')}:</div>
                          <div className="flex items-center gap-2">
                            <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${server.diskUsage > 80 ? "bg-destructive" : server.diskUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                style={{ width: `${server.diskUsage}%` }}
                              />
                            </div>
                            <span>{server.diskUsage !== null && server.diskUsage !== undefined ? `${server.diskUsage}%` : t('Common.noData')}</span>
                          </div>
                          {server.gpuUsage && server.gpuUsage !== null && server.gpuUsage !== undefined && server.gpuUsage.toString() !== "0" && (
                            <>
                              <div className="text-muted-foreground">{t('Common.Server.GPU')}:</div>
                              <div className="flex items-center gap-2">
                                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${server.gpuUsage && server.gpuUsage > 80 ? "bg-destructive" : server.gpuUsage && server.gpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${server.gpuUsage || 0}%` }}
                                  />
                                </div>
                                <span>{server.gpuUsage && server.gpuUsage !== null && server.gpuUsage !== undefined ? `${server.gpuUsage}%` : t('Common.noData')}</span>
                              </div>
                            </>
                          )}
                          {server.temp && server.temp !== null && server.temp !== undefined && server.temp.toString() !== "0" && (
                            <>
                              <div className="text-muted-foreground">{t('Common.Server.Temperature')}:</div>
                              <div className="flex items-center gap-2">
                                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${server.temp && server.temp > 80 ? "bg-destructive" : server.temp && server.temp > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                    style={{ width: `${Math.min(server.temp || 0, 100)}%` }}
                                  />
                                </div>
                                <span>{server.temp !== null && server.temp !== undefined && server.temp !== 0 ? `${server.temp}°C` : t('Common.noData')}</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Charts */}
              {server.monitoring && server.history && (
                <div className="grid grid-cols-1 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>{t('Server.ResourceUsageHistory')}</CardTitle>
                          <CardDescription>
                            {timeRange === '1h' 
                              ? t('Server.TimeRange.LastHour') 
                              : timeRange === '1d'
                                ? t('Server.TimeRange.Last24Hours')
                                : timeRange === '7d' 
                                  ? t('Server.TimeRange.Last7Days') 
                                  : t('Server.TimeRange.Last30Days')}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Select value={timeRange} onValueChange={(value: '1h' | '1d' | '7d' | '30d') => setTimeRange(value)}>
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder={t('Server.TimeRange.Select')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1h">{t('Server.TimeRange.LastHour')}</SelectItem>
                              <SelectItem value="1d">{t('Server.TimeRange.Last24Hours')}</SelectItem>
                              <SelectItem value="7d">{t('Server.TimeRange.Last7Days')}</SelectItem>
                              <SelectItem value="30d">{t('Server.TimeRange.Last30Days')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" onClick={refreshData}>{t('Common.Refresh')}</Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-8">
                          <div className="h-[200px] relative bg-background">
                            <canvas id="cpu-chart" />
                          </div>
                          <div className="h-[200px] relative bg-background">
                            <canvas id="ram-chart" />
                          </div>
                          <div className="h-[200px] relative bg-background">
                            <canvas id="disk-chart" />
                          </div>
                          {server.history?.datasets.gpu.some(value => value !== null && value !== 0) && (
                            <div className="h-[200px] relative bg-background">
                              <canvas id="gpu-chart" />
                            </div>
                          )}
                          {server.history?.datasets.temp.some(value => value !== null && value !== 0) && (
                            <div className="h-[200px] relative bg-background">
                              <canvas id="temp-chart" />
                            </div>
                          )}
                        </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {/* Virtual Machines */}
              {server.hostedVMs && server.hostedVMs.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('Server.VirtualMachines')}</CardTitle>
                    <CardDescription>{t('Server.VirtualMachinesDescription')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {server.hostedVMs.map((hostedVM) => (
                        <div
                          key={hostedVM.id}
                          className="flex flex-col gap-2 border border-muted py-2 px-4 rounded-md"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {hostedVM.icon && (
                                <DynamicIcon
                                  name={hostedVM.icon as any}
                                  size={24}
                                />
                              )}
                              <NextLink href={`/dashboard/servers/${hostedVM.id}`} className="hover:underline">
                                <div className="text-base font-extrabold">
                                  {hostedVM.icon && "･ "}
                                  {hostedVM.name}
                                </div>
                              </NextLink>
                            </div>
                            {hostedVM.monitoring && (
                              <div className="flex flex-col items-end">
                                <StatusIndicator isOnline={hostedVM.online} />
                                {hostedVM.online && hostedVM.uptime && (
                                  <span className="text-xs text-muted-foreground mt-1 w-max text-right whitespace-nowrap">
                                    {t('Common.since', { date: hostedVM.uptime })}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="col-span-full pb-2">
                            <Separator />
                          </div>

                          <div className="flex gap-5 pb-2">
                            <div className="flex items-center gap-2 text-foreground/80">
                              <MonitorCog className="h-4 w-4 text-muted-foreground" />
                              <span>
                                <b>{t('Common.Server.OS')}:</b> {hostedVM.os || "-"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-foreground/80">
                              <FileDigit className="h-4 w-4 text-muted-foreground" />
                              <span>
                                <b>{t('Common.Server.IP')}:</b> {hostedVM.ip || t('Common.notSet')}
                              </span>
                            </div>
                          </div>

                          <div className="col-span-full mb-2">
                            <h4 className="text-sm font-semibold">{t('Server.HardwareInformation')}</h4>
                          </div>

                          <div className="flex items-center gap-2 text-foreground/80">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <b>{t('Common.Server.CPU')}:</b> {hostedVM.cpu || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-foreground/80">
                            <Microchip className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <b>{t('Common.Server.GPU')}:</b> {hostedVM.gpu || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-foreground/80">
                            <MemoryStick className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <b>{t('Common.Server.RAM')}:</b> {hostedVM.ram || "-"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-foreground/80">
                            <HardDrive className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <b>{t('Common.Server.Disk')}:</b> {hostedVM.disk || "-"}
                            </span>
                          </div>

                          {hostedVM.monitoring && (
                            <>
                              <div className="col-span-full pt-2 pb-2">
                                <Separator />
                              </div>

                              <div className="col-span-full grid grid-cols-3 gap-4">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Cpu className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">{t('Common.Server.CPU')}</span>
                                    </div>
                                    <span className="text-xs font-medium">
                                      {hostedVM.cpuUsage || 0}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                    <div
                                      className={`h-full ${hostedVM.cpuUsage && hostedVM.cpuUsage > 80 ? "bg-destructive" : hostedVM.cpuUsage && hostedVM.cpuUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${hostedVM.cpuUsage || 0}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <MemoryStick className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">{t('Common.Server.RAM')}</span>
                                    </div>
                                    <span className="text-xs font-medium">
                                      {hostedVM.ramUsage || 0}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                    <div
                                      className={`h-full ${hostedVM.ramUsage && hostedVM.ramUsage > 80 ? "bg-destructive" : hostedVM.ramUsage && hostedVM.ramUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${hostedVM.ramUsage || 0}%` }}
                                    />
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm font-medium">{t('Common.Server.Disk')}</span>
                                    </div>
                                    <span className="text-xs font-medium">
                                      {hostedVM.diskUsage || 0}%
                                    </span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-secondary mt-1">
                                    <div
                                      className={`h-full ${hostedVM.diskUsage && hostedVM.diskUsage > 80 ? "bg-destructive" : hostedVM.diskUsage && hostedVM.diskUsage > 60 ? "bg-amber-500" : "bg-emerald-500"}`}
                                      style={{ width: `${hostedVM.diskUsage || 0}%` }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="text-center p-12">
              <h2 className="text-2xl font-bold">{t('Server.NotFound')}</h2>
              <p className="text-muted-foreground mt-2">{t('Server.NotFoundDescription')}</p>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
