"use client"

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Separator } from './ui/separator'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Minus, Info, Loader2, Download } from 'lucide-react'
import { useTranslations } from 'next-intl'

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

interface PortMapping {
  hostPort: string
  containerPort: string
  protocol: string
}

interface EnvVariable {
  key: string
  value: string
  description?: string
}

interface VolumeMount {
  hostPath: string
  containerPath: string
  mode: string
}

interface DeploymentConfigProps {
  application: Application | null
  isOpen: boolean
  onClose: () => void
  onDeploy: (config: DeploymentConfiguration) => void
  isDeploying: boolean
}

interface DeploymentConfiguration {
  applicationId: number
  ports: PortMapping[]
  environment: EnvVariable[]
  volumes: VolumeMount[]
  containerName?: string
  restartPolicy: string
  networkMode: string
  privileged: boolean
  autoRemove: boolean
}

export function DeploymentConfig({ application, isOpen, onClose, onDeploy, isDeploying }: DeploymentConfigProps) {
  const t = useTranslations('Dashboard')
  
  const [ports, setPorts] = useState<PortMapping[]>([])
  const [environment, setEnvironment] = useState<EnvVariable[]>([])
  const [volumes, setVolumes] = useState<VolumeMount[]>([])
  const [containerName, setContainerName] = useState('')
  const [restartPolicy, setRestartPolicy] = useState('unless-stopped')
  const [networkMode, setNetworkMode] = useState('bridge')
  const [privileged, setPrivileged] = useState(false)
  const [autoRemove, setAutoRemove] = useState(false)

  useEffect(() => {
    if (application && isOpen) {
      // Initialize with default values from application
      try {
        const defaultPorts = application.ports ? JSON.parse(application.ports) : {}
        const portMappings: PortMapping[] = Object.entries(defaultPorts).map(([hostPort, containerPort]) => ({
          hostPort: hostPort,
          containerPort: String(containerPort),
          protocol: 'tcp'
        }))
        setPorts(portMappings.length > 0 ? portMappings : [{ hostPort: '', containerPort: '', protocol: 'tcp' }])

        const defaultEnv = application.environment ? JSON.parse(application.environment) : {}
        const envVars: EnvVariable[] = Object.entries(defaultEnv).map(([key, value]) => ({
          key,
          value: String(value)
        }))
        setEnvironment(envVars.length > 0 ? envVars : [{ key: '', value: '' }])

        const defaultVolumes = application.volumes ? JSON.parse(application.volumes) : {}
        const volumeMappings: VolumeMount[] = Object.entries(defaultVolumes).map(([hostPath, containerPath]) => ({
          hostPath,
          containerPath: String(containerPath),
          mode: 'rw'
        }))
        setVolumes(volumeMappings.length > 0 ? volumeMappings : [{ hostPath: '', containerPath: '', mode: 'rw' }])

        setContainerName(`serverdash-${application.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${application.id}`)
      } catch (error) {
        console.error('Error parsing application config:', error)
        // Set defaults if parsing fails
        setPorts([{ hostPort: '', containerPort: '', protocol: 'tcp' }])
        setEnvironment([{ key: '', value: '' }])
        setVolumes([{ hostPath: '', containerPath: '', mode: 'rw' }])
        setContainerName(`serverdash-${application?.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '-')}-${application?.id}`)
      }
    }
  }, [application, isOpen])

  const addPort = () => {
    setPorts([...ports, { hostPort: '', containerPort: '', protocol: 'tcp' }])
  }

  const removePort = (index: number) => {
    setPorts(ports.filter((_, i) => i !== index))
  }

  const updatePort = (index: number, field: keyof PortMapping, value: string) => {
    const newPorts = [...ports]
    newPorts[index] = { ...newPorts[index], [field]: value }
    setPorts(newPorts)
  }

  const addEnvVar = () => {
    setEnvironment([...environment, { key: '', value: '' }])
  }

  const removeEnvVar = (index: number) => {
    setEnvironment(environment.filter((_, i) => i !== index))
  }

  const updateEnvVar = (index: number, field: keyof EnvVariable, value: string) => {
    const newEnv = [...environment]
    newEnv[index] = { ...newEnv[index], [field]: value }
    setEnvironment(newEnv)
  }

  const addVolume = () => {
    setVolumes([...volumes, { hostPath: '', containerPath: '', mode: 'rw' }])
  }

  const removeVolume = (index: number) => {
    setVolumes(volumes.filter((_, i) => i !== index))
  }

  const updateVolume = (index: number, field: keyof VolumeMount, value: string) => {
    const newVolumes = [...volumes]
    newVolumes[index] = { ...newVolumes[index], [field]: value }
    setVolumes(newVolumes)
  }

  const handleDeploy = () => {
    if (!application) return

    const config: DeploymentConfiguration = {
      applicationId: application.id,
      ports: ports.filter(p => p.hostPort && p.containerPort),
      environment: environment.filter(e => e.key && e.value),
      volumes: volumes.filter(v => v.hostPath && v.containerPath),
      containerName,
      restartPolicy,
      networkMode,
      privileged,
      autoRemove
    }

    onDeploy(config)
  }

  if (!application) return null

  return (
    <Dialog open={isOpen} onOpenChange={() => !isDeploying && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {application.icon && (
              <span className="text-2xl">{application.icon}</span>
            )}
            <div>
              <div className="text-lg">Deploy {application.name}</div>
              <div className="text-sm font-normal text-muted-foreground">
                Configure deployment settings
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="ports" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="ports">Ports</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="volumes">Volumes</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="info">Info</TabsTrigger>
            </TabsList>

            <TabsContent value="ports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Port Mappings</CardTitle>
                  <CardDescription>
                    Configure how ports are exposed from the container to the host
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ports.map((port, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`host-port-${index}`}>Host Port</Label>
                          <Input
                            id={`host-port-${index}`}
                            placeholder="8080"
                            value={port.hostPort}
                            onChange={(e) => updatePort(index, 'hostPort', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`container-port-${index}`}>Container Port</Label>
                          <Input
                            id={`container-port-${index}`}
                            placeholder="80"
                            value={port.containerPort}
                            onChange={(e) => updatePort(index, 'containerPort', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`protocol-${index}`}>Protocol</Label>
                          <select
                            id={`protocol-${index}`}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={port.protocol}
                            onChange={(e) => updatePort(index, 'protocol', e.target.value)}
                          >
                            <option value="tcp">TCP</option>
                            <option value="udp">UDP</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removePort(index)}
                        disabled={ports.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addPort} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Port Mapping
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="environment" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Environment Variables</CardTitle>
                  <CardDescription>
                    Set environment variables that will be available inside the container
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {environment.map((env, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor={`env-key-${index}`}>Variable Name</Label>
                          <Input
                            id={`env-key-${index}`}
                            placeholder="DATABASE_URL"
                            value={env.key}
                            onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`env-value-${index}`}>Value</Label>
                          <Input
                            id={`env-value-${index}`}
                            placeholder="postgresql://..."
                            value={env.value}
                            onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeEnvVar(index)}
                        disabled={environment.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addEnvVar} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Environment Variable
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="volumes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Volume Mounts</CardTitle>
                  <CardDescription>
                    Mount directories or files from the host into the container
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {volumes.map((volume, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex-1 grid grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`host-path-${index}`}>Host Path</Label>
                          <Input
                            id={`host-path-${index}`}
                            placeholder="/host/path"
                            value={volume.hostPath}
                            onChange={(e) => updateVolume(index, 'hostPath', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`container-path-${index}`}>Container Path</Label>
                          <Input
                            id={`container-path-${index}`}
                            placeholder="/container/path"
                            value={volume.containerPath}
                            onChange={(e) => updateVolume(index, 'containerPath', e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`mode-${index}`}>Mode</Label>
                          <select
                            id={`mode-${index}`}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={volume.mode}
                            onChange={(e) => updateVolume(index, 'mode', e.target.value)}
                          >
                            <option value="rw">Read/Write</option>
                            <option value="ro">Read Only</option>
                          </select>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeVolume(index)}
                        disabled={volumes.length === 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" onClick={addVolume} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Volume Mount
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Settings</CardTitle>
                  <CardDescription>
                    Configure advanced Docker container options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="container-name">Container Name</Label>
                    <Input
                      id="container-name"
                      value={containerName}
                      onChange={(e) => setContainerName(e.target.value)}
                      placeholder="my-container"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="restart-policy">Restart Policy</Label>
                    <select
                      id="restart-policy"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={restartPolicy}
                      onChange={(e) => setRestartPolicy(e.target.value)}
                    >
                      <option value="no">No restart</option>
                      <option value="unless-stopped">Unless stopped</option>
                      <option value="always">Always</option>
                      <option value="on-failure">On failure</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="network-mode">Network Mode</Label>
                    <select
                      id="network-mode"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={networkMode}
                      onChange={(e) => setNetworkMode(e.target.value)}
                    >
                      <option value="bridge">Bridge</option>
                      <option value="host">Host</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="privileged"
                      checked={privileged}
                      onChange={(e) => setPrivileged(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="privileged">Privileged mode</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="auto-remove"
                      checked={autoRemove}
                      onChange={(e) => setAutoRemove(e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor="auto-remove">Auto-remove container when stopped</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Application Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Docker Image</Label>
                      <Badge variant="outline" className="mt-1 font-mono text-xs">
                        {application.dockerImage}
                      </Badge>
                    </div>
                    <div>
                      <Label>Version</Label>
                      <Badge variant="outline" className="mt-1">
                        {application.version}
                      </Badge>
                    </div>
                    {application.author && (
                      <div>
                        <Label>Author</Label>
                        <p className="text-sm text-muted-foreground mt-1">{application.author}</p>
                      </div>
                    )}
                    <div>
                      <Label>Category</Label>
                      <Badge variant="secondary" className="mt-1">
                        {application.category}
                      </Badge>
                    </div>
                  </div>
                  
                  {application.description && (
                    <div>
                      <Label>Description</Label>
                      <p className="text-sm text-muted-foreground mt-1">{application.description}</p>
                    </div>
                  )}

                  {(application.website || application.documentation) && (
                    <div className="flex gap-2">
                      {application.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.website} target="_blank" rel="noopener noreferrer">
                            Website
                          </a>
                        </Button>
                      )}
                      {application.documentation && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={application.documentation} target="_blank" rel="noopener noreferrer">
                            Documentation
                          </a>
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <Separator />
        
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isDeploying}>
            Cancel
          </Button>
          <Button onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Deploy Application
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 