"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { Package, Store, Settings, Search, Filter, Play, Square, Trash2, Download, Loader2, RefreshCw, ExternalLink, Terminal, Globe, Copy, Eye } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { TerminalWrapper } from "@/components/TerminalWrapper"
import { DeploymentConfig } from "@/components/DeploymentConfig"

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
  message?: string
  containerId?: string
  status?: string
  updatedCount?: number
  updates?: any[]
  hasWebAccess?: boolean
  webUrl?: string
  port?: string
  requiresAuth?: boolean
  defaultCredentials?: { username: string, password: string }
  ports?: Record<string, string>
  logs?: string
  applicationName?: string
  output?: string
  terminalCommand?: string
}

export function Applications() {
  const t = useTranslations('Dashboard')
  const [applications, setApplications] = useState<Application[]>([])
  const [deployedApplications, setDeployedApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [deployingIds, setDeployingIds] = useState<Set<number>>(new Set())
  const [controllingIds, setControllingIds] = useState<Set<number>>(new Set())
  const [deploymentProgress, setDeploymentProgress] = useState<Record<number, number>>({})
  const [webAccessInfo, setWebAccessInfo] = useState<Record<number, any>>({})
  const [showLogs, setShowLogs] = useState<Record<number, boolean>>({})
  const [logs, setLogs] = useState<Record<number, string>>({})
  const [showTerminal, setShowTerminal] = useState<Record<number, boolean>>({})
  const [terminalApp, setTerminalApp] = useState<Application | null>(null)
  const [showDeployConfig, setShowDeployConfig] = useState(false)
  const [deployingApp, setDeployingApp] = useState<Application | null>(null)
  const [activeTab, setActiveTab] = useState('store')

  const categories = [
    { value: "all", label: t('Applications.Categories.All') },
    { value: "development", label: t('Applications.Categories.Development') },
    { value: "database", label: t('Applications.Categories.Database') },
    { value: "monitoring", label: t('Applications.Categories.Monitoring') },
    { value: "productivity", label: t('Applications.Categories.Productivity') },
    { value: "networking", label: t('Applications.Categories.Networking') },
    { value: "security", label: t('Applications.Categories.Security') },
    { value: "other", label: t('Applications.Categories.Other') }
  ]

  const fetchApplications = async (deployed?: boolean) => {
    try {
      const response = await axios.post<ApiResponse>('/api/applications/get', {
        page: 1,
        ITEMS_PER_PAGE: 100,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        search: searchTerm || undefined,
        deployed
      })
      
      if (response.data.success && response.data.applications) {
        if (deployed) {
          setDeployedApplications(response.data.applications)
        } else {
          setApplications(response.data.applications)
        }
      }
    } catch (error) {
      console.error('Failed to fetch applications:', error)
      toast.error('Failed to fetch applications')
    }
  }

  const simulateProgress = (applicationId: number) => {
    let progress = 0
    console.log('🚀 Starting progress simulation for app:', applicationId)
    
    // Initialize progress at 0%
    setDeploymentProgress(prev => ({ ...prev, [applicationId]: 0 }))
    
    const interval = setInterval(() => {
      // Simulate realistic deployment progress with different speeds for different stages
      if (progress < 20) {
        // Preparation stage - fast
        progress += Math.random() * 8 + 2
      } else if (progress < 40) {
        // Docker image pulling - moderate
        progress += Math.random() * 6 + 1
      } else if (progress < 60) {
        // Configuration stage - fast
        progress += Math.random() * 8 + 2
      } else if (progress < 80) {
        // Container starting - moderate
        progress += Math.random() * 6 + 1
      } else if (progress < 95) {
        // Finalizing - slow
        progress += Math.random() * 4 + 1
      } else {
        // Don't complete automatically - let the API response do it
        console.log('📊 Progress simulation reached 95%, stopping for app:', applicationId)
        clearInterval(interval)
        return
      }
      
      // Cap at 95% until API completes
      if (progress > 95) progress = 95
      
      console.log('📊 Progress update for app:', applicationId, '- Progress:', Math.round(progress))
      setDeploymentProgress(prev => {
        const updated = { ...prev, [applicationId]: progress }
        console.log('📊 Updated deploymentProgress state:', updated)
        return updated
      })
    }, 400)
    
    return interval
  }

  const handleDeploy = (application: Application) => {
    // Open deployment configuration modal
    console.log('🚀 handleDeploy called for app:', application.id)
    setDeployingApp(application)
    setShowDeployConfig(true)
  }

  const openDeployConfig = (application: Application) => {
    setDeployingApp(application)
    setShowDeployConfig(true)
  }

  const closeDeployConfig = () => {
    setShowDeployConfig(false)
    setDeployingApp(null)
  }

  const deployWithConfig = async (config: any) => {
    if (!deployingApp) {
      console.log('❌ deployWithConfig called but no deployingApp set!')
      return
    }

    console.log('🚀 deployWithConfig called for app:', deployingApp.id, 'with config:', config)
    setDeployingIds(prev => {
      const newSet = new Set(prev).add(deployingApp.id)
      console.log('🚀 Updated deployingIds:', Array.from(newSet))
      return newSet
    })
    
    // Small delay to ensure state is updated before starting progress
    setTimeout(() => {
      console.log('📊 Starting progress simulation after timeout...')
      const progressInterval = simulateProgress(deployingApp.id)
      console.log('📊 Progress interval created:', progressInterval)
      
      // Store interval reference for cleanup
      const deploymentRef = { interval: progressInterval }
      
      const executeDeployment = async () => {
        try {
          const response = await axios.post<ApiResponse>('/api/applications/deploy', config)
          
          clearInterval(deploymentRef.interval)
          
          if (response.data.success) {
            // Set progress to 100% to trigger success state
            console.log('✅ Deployment successful, setting progress to 100%')
            setDeploymentProgress(prev => ({ ...prev, [deployingApp.id]: 100 }))
            toast.success(t('Applications.DeploymentSuccess'))
            await fetchApplications(false) // Refresh store
            await fetchApplications(true)  // Refresh deployed
            
            // Fallback redirect mechanism in case the progress component doesn't handle it
            setTimeout(() => {
              if (showDeployConfig) {
                handleDeploymentComplete()
                closeDeployConfig()
              }
            }, 4000)
            
            // Don't close the config here, let the progress component handle it
          } else {
            toast.error(response.data.error || t('Applications.DeploymentError'))
          }
        } catch (error: any) {
          clearInterval(deploymentRef.interval)
          console.error('Deploy error:', error)
          const errorMessage = error.response?.data?.error || t('Applications.DeploymentError')
          
          // Reset deployment progress and show error
          setDeploymentProgress(prev => ({ ...prev, [deployingApp.id]: 0 }))
          
          // Show more specific error for port conflicts
          if (errorMessage.includes('bind: address already in use')) {
            toast.error('Port already in use. Please choose a different port or stop the conflicting service.')
          } else if (errorMessage.includes('container name') && errorMessage.includes('already in use')) {
            toast.error('Container name conflict. Cleaning up and retrying...')
          } else {
            toast.error(errorMessage)
          }

          // Immediate cleanup on error
          setDeployingIds(prev => {
            const newSet = new Set(prev)
            newSet.delete(deployingApp.id)
            return newSet
          })
        } finally {
          // Delay clearing deployingIds to allow redirect to complete
          setTimeout(() => {
            setDeployingIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(deployingApp.id)
              return newSet
            })
          }, 3000)
          
          // Clear progress after a longer delay to allow for redirect
          setTimeout(() => {
            setDeploymentProgress(prev => {
              const newProgress = { ...prev }
              delete newProgress[deployingApp.id]
              return newProgress
            })
          }, 5000)
        }
      }
      
      executeDeployment()
    }, 100) // Small delay to ensure state updates are processed
  }

  const handleDeploymentComplete = () => {
    // Switch to deployed applications tab
    setActiveTab('deployed')
    
    // Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleControl = async (application: Application, action: 'start' | 'stop' | 'remove') => {
    setControllingIds(prev => new Set(prev).add(application.id))
    
    try {
      const response = await axios.post<ApiResponse>('/api/applications/control', {
        applicationId: application.id,
        action
      })
      
      if (response.data.success) {
        const messages = {
          start: t('Applications.StartSuccess'),
          stop: t('Applications.StopSuccess'),
          remove: t('Applications.RemoveSuccess')
        }
        toast.success(messages[action])
        await fetchApplications(true) // Refresh deployed applications
      } else {
        const errorMessages = {
          start: t('Applications.StartError'),
          stop: t('Applications.StopError'),
          remove: t('Applications.RemoveError')
        }
        toast.error(response.data.error || errorMessages[action])
      }
    } catch (error: any) {
      console.error(`${action} error:`, error)
      const errorMessages = {
        start: t('Applications.StartError'),
        stop: t('Applications.StopError'),
        remove: t('Applications.RemoveError')
      }
      toast.error(error.response?.data?.error || errorMessages[action])
    } finally {
      setControllingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(application.id)
        return newSet
      })
    }
  }

  const checkApplicationStatuses = async () => {
    try {
      const response = await axios.post<ApiResponse>('/api/applications/status')
      if (response.data.success && response.data.updatedCount && response.data.updatedCount > 0) {
        // Refresh deployed applications if statuses were updated
        await fetchApplications(true)
      }
    } catch (error) {
      console.error('Failed to check application statuses:', error)
    }
  }

  const getWebAccess = async (application: Application) => {
    try {
      const response = await axios.post<ApiResponse>('/api/applications/webaccess', {
        applicationId: application.id
      })
      
      if (response.data.success) {
        setWebAccessInfo(prev => ({
          ...prev,
          [application.id]: response.data
        }))
        
        if (response.data.hasWebAccess && response.data.webUrl) {
          window.open(response.data.webUrl, '_blank')
        } else {
          toast.info(response.data.message || 'This application does not have a web interface')
        }
      }
    } catch (error: any) {
      console.error('Web access error:', error)
      toast.error('Failed to get web access information')
    }
  }

  const openTerminal = async (application: Application) => {
    if (application.status !== 'running') {
      toast.error('Container must be running to access terminal')
      return
    }

    setTerminalApp(application)
    setShowTerminal(prev => ({ ...prev, [application.id]: true }))
  }

  const closeTerminal = (applicationId: number) => {
    setShowTerminal(prev => ({ ...prev, [applicationId]: false }))
    setTerminalApp(null)
  }

  const getLogs = async (application: Application) => {
    try {
      const response = await axios.post<ApiResponse>('/api/applications/logs', {
        applicationId: application.id,
        lines: 100
      })
      
      if (response.data.success && response.data.logs) {
        setLogs(prev => ({
          ...prev,
          [application.id]: response.data.logs || ''
        }))
        setShowLogs(prev => ({
          ...prev,
          [application.id]: true
        }))
      } else {
        toast.error(response.data.error || 'Failed to get logs')
      }
    } catch (error: any) {
      console.error('Logs error:', error)
      toast.error('Failed to get application logs')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchApplications(false), // Store applications
        fetchApplications(true)   // Deployed applications
      ])
      setLoading(false)
    }
    
    loadData()
  }, [searchTerm, selectedCategory])

  // Auto-refresh deployed applications status every 30 seconds
  useEffect(() => {
    const interval = setInterval(checkApplicationStatuses, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      running: { variant: "default", label: t('Applications.Status.Running') },
      stopped: { variant: "secondary", label: t('Applications.Status.Stopped') },
      error: { variant: "destructive", label: t('Applications.Status.Error') },
      deploying: { variant: "outline", label: t('Applications.Status.Deploying') }
    } as const

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.stopped
    return <Badge variant={config.variant as any}>{config.label}</Badge>
  }

  const ApplicationCard = ({ application, isDeployed = false }: { application: Application, isDeployed?: boolean }) => {
    const isDeploying = deployingIds.has(application.id)
    const isControlling = controllingIds.has(application.id)
    const progress = deploymentProgress[application.id] || 0
    
    return (
      <Card className="modern-card h-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              {application.icon ? (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{application.icon}</span>
                </div>
              ) : (
                <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg">{application.name}</CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline">{application.category}</Badge>
                  {application.featured && <Badge variant="default">{t('Applications.Featured')}</Badge>}
                  {isDeployed && getStatusBadge(application.status)}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-4 line-clamp-3">
            {application.description || "No description available"}
          </CardDescription>
          
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div><strong>{t('Applications.Version')}:</strong> {application.version}</div>
            {application.author && <div><strong>{t('Applications.Author')}:</strong> {application.author}</div>}
            
            {/* Port Information */}
            {isDeployed && application.ports && (() => {
              try {
                const ports = JSON.parse(application.ports) as Record<string, string>
                return (
                  <div>
                    <strong>Ports:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(ports).map(([hostPort, containerPort]) => (
                        <Badge key={`${hostPort}-${containerPort}`} variant="secondary" className="text-xs">
                          {hostPort}→{String(containerPort)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )
              } catch {
                return null
              }
            })()}
            
            {application.tags && (
              <div className="flex flex-wrap gap-1 mt-2">
                {application.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">{tag.trim()}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Deployment Progress */}
          {isDeploying && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Downloading and deploying...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="space-y-3">
            {/* Main Action Buttons */}
            <div className="flex gap-2">
              {!isDeployed ? (
                <Button 
                  onClick={() => handleDeploy(application)}
                  disabled={isDeploying}
                  className="flex-1"
                >
                  {isDeploying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('Applications.Deploying')}
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      {t('Applications.Deploy')}
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-2 w-full">
                  {application.status === 'stopped' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleControl(application, 'start')}
                      disabled={isControlling}
                      className="flex-1"
                    >
                      {isControlling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      {isControlling ? t('Applications.Starting') : t('Applications.Start')}
                    </Button>
                  )}
                  
                  {application.status === 'running' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleControl(application, 'stop')}
                      disabled={isControlling}
                      className="flex-1"
                    >
                      {isControlling ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Square className="h-4 w-4 mr-2" />
                      )}
                      {isControlling ? t('Applications.Stopping') : t('Applications.Stop')}
                    </Button>
                  )}
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={isControlling}
                      >
                        {isControlling ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Application</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will stop and remove the container for "{application.name}". This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleControl(application, 'remove')}
                          className="bg-destructive text-destructive-foreground"
                        >
                          {isControlling ? t('Applications.Removing') : t('Applications.Remove')}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Access Buttons for Deployed Applications */}
            {isDeployed && application.status === 'running' && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getWebAccess(application)}
                  className="flex-1"
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Web Dashboard
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openTerminal(application)}
                  className="flex-1"
                >
                  <Terminal className="h-4 w-4 mr-2" />
                  Terminal
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => getLogs(application)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Logs Display */}
            {showLogs[application.id] && logs[application.id] && (
              <div className="mt-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Container Logs</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(logs[application.id])}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLogs(prev => ({ ...prev, [application.id]: false }))}
                    >
                      ×
                    </Button>
                  </div>
                </div>
                <pre className="text-xs bg-background p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {logs[application.id]}
                </pre>
              </div>
            )}

            {/* Web Access Info */}
            {isDeployed && webAccessInfo[application.id]?.requiresAuth && (
              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950 rounded text-xs">
                <strong>Login Info:</strong> {webAccessInfo[application.id].defaultCredentials?.username} / {webAccessInfo[application.id].defaultCredentials?.password}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-spin" />
          <p className="text-muted-foreground">Loading applications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="relative mb-12">
        <h1 className="title-large clean-gradient mb-4">{t('Applications.Title')}</h1>
        <p className="subtitle max-w-2xl">
          {t('Applications.Description')}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="store" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            {t('Applications.Store')}
          </TabsTrigger>
          <TabsTrigger value="deployed" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            {t('Applications.MyApplications')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="store" className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{t('Applications.Store')}</h2>
              <p className="text-muted-foreground">{t('Applications.StoreDescription')}</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('Applications.SearchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No applications found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {applications.map((application) => (
                <ApplicationCard key={application.id} application={application} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="deployed" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold mb-2">{t('Applications.MyApplications')}</h2>
              <p className="text-muted-foreground">{t('Applications.MyApplicationsDescription')}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Auto-monitoring every 30s</span>
              <Button
                variant="outline"
                size="sm"
                onClick={checkApplicationStatuses}
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Status
              </Button>
            </div>
          </div>

          {deployedApplications.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">{t('Applications.NoApplications')}</h3>
              <p className="text-muted-foreground">{t('Applications.NoApplicationsDescription')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {deployedApplications.map((application) => (
                <ApplicationCard key={application.id} application={application} isDeployed={true} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Terminal Modal */}
      {terminalApp && (
        <Dialog 
          open={showTerminal[terminalApp.id] || false} 
          onOpenChange={(open) => !open && closeTerminal(terminalApp.id)}
        >
          <DialogContent className="max-w-5xl max-h-[80vh] p-0">
            <TerminalWrapper
              applicationId={terminalApp.id}
              applicationName={terminalApp.name}
              containerId={terminalApp.containerId || ''}
              onClose={() => closeTerminal(terminalApp.id)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Deployment Configuration Modal */}
              <DeploymentConfig
          application={deployingApp}
          isOpen={showDeployConfig}
          onClose={closeDeployConfig}
          onDeploy={deployWithConfig}
          isDeploying={deployingApp ? deployingIds.has(deployingApp.id) : false}
          deploymentProgress={(() => {
            const progress = deployingApp ? (deploymentProgress[deployingApp.id] || 0) : 0
            console.log('🔄 Calculating deploymentProgress prop:', {
              deployingApp: deployingApp?.id,
              deploymentProgressState: deploymentProgress,
              calculatedProgress: progress
            })
            return progress
          })()}
          onDeploymentComplete={handleDeploymentComplete}
        />
    </div>
  )
} 