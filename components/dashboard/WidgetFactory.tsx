"use client"

import { GlancesMonitorWidget } from '@/components/glances-monitor-widget'
import { ApplicationsWidget } from '@/components/applications-widget'
import { ServersStatsWidget } from '@/components/widgets/ServersStatsWidget'
import { VirtualMachinesStatsWidget } from '@/components/widgets/VirtualMachinesStatsWidget'
import { NetworkDevicesStatsWidget } from '@/components/widgets/NetworkDevicesStatsWidget'
import { UptimeMonitorWidget } from '@/components/widgets/UptimeMonitorWidget'
import { SecurityAlertsWidget } from '@/components/widgets/SecurityAlertsWidget'
import { SystemUpdatesWidget } from '@/components/widgets/SystemUpdatesWidget'

interface WidgetFactoryProps {
  widgetId: string
  config?: any
}

export function WidgetFactory({ widgetId, config }: WidgetFactoryProps) {
  switch (widgetId) {
    case 'glances-monitor':
      return <GlancesMonitorWidget />
    case 'applications':
      return <ApplicationsWidget />
    case 'servers-stats':
      return <ServersStatsWidget />
    case 'virtual-machines-stats':
      return <VirtualMachinesStatsWidget />
    case 'network-devices-stats':
      return <NetworkDevicesStatsWidget />
    case 'uptime-monitor':
      return <UptimeMonitorWidget />
    case 'security-alerts':
      return <SecurityAlertsWidget />
    case 'system-updates':
      return <SystemUpdatesWidget />
    default:
      return (
        <div className="modern-card">
          <div className="p-6">
            <div className="text-center py-8">
              <p className="text-muted-foreground">Unknown widget: {widgetId}</p>
            </div>
          </div>
        </div>
      )
  }
} 