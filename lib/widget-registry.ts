import { ReactNode } from 'react'
import { Activity, Server, Layers, Network, Package, BarChart3, Clock, Shield, Download, Settings } from 'lucide-react'

export interface WidgetConfig {
  id: string
  name: string
  description: string
  icon: any
  component: string
  defaultSize: {
    cols: number
    rows: number
  }
  category: string
  enabled: boolean
}

export interface DashboardWidget {
  id: string
  widgetId: string
  position: number
  enabled: boolean
  config?: any
}

export const WIDGET_REGISTRY: Record<string, WidgetConfig> = {
  'glances-monitor': {
    id: 'glances-monitor',
    name: 'System Monitor',
    description: 'Real-time system monitoring with CPU, RAM, and disk usage',
    icon: Activity,
    component: 'GlancesMonitorWidget',
    defaultSize: { cols: 2, rows: 1 },
    category: 'monitoring',
    enabled: true,
  },
  'applications': {
    id: 'applications',
    name: 'Applications',
    description: 'View and manage deployed container applications',
    icon: Package,
    component: 'ApplicationsWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'applications',
    enabled: true,
  },
  'servers-stats': {
    id: 'servers-stats',
    name: 'Server Statistics',
    description: 'Overview of server count and status',
    icon: Server,
    component: 'ServersStatsWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'infrastructure',
    enabled: true,
  },
  'virtual-machines-stats': {
    id: 'virtual-machines-stats',
    name: 'Virtual Machine Statistics',
    description: 'Overview of virtual machine count and status',
    icon: Layers,
    component: 'VirtualMachinesStatsWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'infrastructure',
    enabled: true,
  },
  'network-devices-stats': {
    id: 'network-devices-stats',
    name: 'Network Device Statistics',
    description: 'Overview of network device count and status',
    icon: Network,
    component: 'NetworkDevicesStatsWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'infrastructure',
    enabled: true,
  },
  'uptime-monitor': {
    id: 'uptime-monitor',
    name: 'Uptime Monitor',
    description: 'System uptime and availability statistics',
    icon: Clock,
    component: 'UptimeMonitorWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'monitoring',
    enabled: true,
  },
  'security-alerts': {
    id: 'security-alerts',
    name: 'Security Alerts',
    description: 'Recent security alerts and notifications',
    icon: Shield,
    component: 'SecurityAlertsWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'security',
    enabled: true,
  },
  'system-updates': {
    id: 'system-updates',
    name: 'System Updates',
    description: 'Check and manage system package updates',
    icon: Download,
    component: 'SystemUpdatesWidget',
    defaultSize: { cols: 1, rows: 1 },
    category: 'system',
    enabled: true,
  },
}

export const WIDGET_CATEGORIES = {
  monitoring: { name: 'Monitoring', icon: Activity },
  infrastructure: { name: 'Infrastructure', icon: Server },
  applications: { name: 'Applications', icon: Package },
  security: { name: 'Security', icon: Shield },
  system: { name: 'System', icon: Settings },
  analytics: { name: 'Analytics', icon: BarChart3 },
}

export function getAvailableWidgets(): WidgetConfig[] {
  return Object.values(WIDGET_REGISTRY).filter(widget => widget.enabled)
}

export function getWidgetConfig(widgetId: string): WidgetConfig | undefined {
  return WIDGET_REGISTRY[widgetId]
} 