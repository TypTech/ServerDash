import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

const deviceTypes = [
  {
    id: "switches",
    name: "Network Switches",
    icon: "🔀",
    description: "Configure and manage network switches for LAN connectivity",
    href: "/dashboard/network-devices/switches",
    color: "bg-blue-50 border-blue-200",
    buttonColor: "bg-blue-600 hover:bg-blue-700"
  },
  {
    id: "access-points",
    name: "Access Points",
    icon: "📶",
    description: "Set up and manage wireless access points and WiFi infrastructure",
    href: "/dashboard/network-devices/access-points",
    color: "bg-green-50 border-green-200",
    buttonColor: "bg-green-600 hover:bg-green-700"
  },
  {
    id: "routers",
    name: "Routers",
    icon: "🌐",
    description: "Configure gateway routers and routing infrastructure",
    href: "/dashboard/network-devices/routers",
    color: "bg-purple-50 border-purple-200",
    buttonColor: "bg-purple-600 hover:bg-purple-700"
  },
  {
    id: "firewalls",
    name: "Firewalls",
    icon: "🛡️",
    description: "Manage network security firewalls and access control",
    href: "/dashboard/network-devices/firewalls",
    color: "bg-red-50 border-red-200",
    buttonColor: "bg-red-600 hover:bg-red-700"
  },
  {
    id: "repeaters",
    name: "Repeaters",
    icon: "📡",
    description: "Configure signal repeaters and network extenders",
    href: "/dashboard/network-devices/repeaters",
    color: "bg-orange-50 border-orange-200",
    buttonColor: "bg-orange-600 hover:bg-orange-700"
  },
  {
    id: "other",
    name: "Other Devices",
    icon: "🔧",
    description: "Configure other specialized network devices and equipment",
    href: "/dashboard/network-devices/other",
    color: "bg-gray-50 border-gray-200",
    buttonColor: "bg-gray-600 hover:bg-gray-700"
  }
];

export default function NetworkDeviceSetupPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard/network-devices">
                    Network Devices
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Device Setup</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">🔧 Network Device Setup</h1>
            <p className="text-muted-foreground">
              Configure and manage your network infrastructure by device type
            </p>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Setup Overview
              </CardTitle>
              <CardDescription>
                Choose a device type below to configure and manage your network infrastructure
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Professional Setup</Badge>
                <Badge variant="outline">Type-Specific Configuration</Badge>
                <Badge variant="outline">Real-time Monitoring</Badge>
                <Badge variant="outline">Security Focused</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Device Type Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {deviceTypes.map((deviceType) => (
              <Card key={deviceType.id} className={`${deviceType.color} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{deviceType.icon}</div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{deviceType.name}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <CardDescription className="text-sm">
                    {deviceType.description}
                  </CardDescription>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Configuration Features:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• Hardware details and specifications</li>
                      <li>• Network configuration settings</li>
                      <li>• Monitoring and health checks</li>
                      <li>• Management interface access</li>
                    </ul>
                  </div>
                  
                  <Link href={deviceType.href}>
                    <Button className={`w-full ${deviceType.buttonColor}`}>
                      Configure {deviceType.name}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Getting Started Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h3 className="font-semibold mb-2">📋 Setup Steps</h3>
                  <ol className="list-decimal list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Choose your device type from the cards above</li>
                    <li>Add device details and network configuration</li>
                    <li>Enable monitoring for real-time status</li>
                    <li>View devices in the uptime dashboard</li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">💡 Best Practices</h3>
                  <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                    <li>Use descriptive names and locations</li>
                    <li>Keep firmware versions up to date</li>
                    <li>Enable monitoring for critical devices</li>
                    <li>Document network topology and settings</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 