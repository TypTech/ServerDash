"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast, Toaster } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

interface NetworkDevice {
  id: number;
  name: string;
  type: string;
  brand?: string;
  model?: string;
  ip?: string;
  location?: string;
  description?: string;
  online: boolean;
  monitoring: boolean;
  createdAt: string;
}

export default function NetworkDevices() {
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    brand: "",
    model: "",
    ip: "",
    location: "",
    description: "",
    // Switch specific
    ports: "",
    poeSupport: "",
    poeWattage: "",
    managedType: "",
    vlanSupport: false,
    stackable: false,
    // Access Point specific
    wifiStandard: "",
    frequency: "",
    maxClients: "",
    antennaType: "",
    powerOutput: "",
    beamforming: false,
    // Router specific
    wanPorts: "",
    lanPorts: "",
    routingProtocols: "",
    vpnSupport: false,
    firewallBuiltin: false,
    bandwidth: "",
    // Firewall specific
    throughput: "",
    maxConnections: "",
    vpnTunnels: "",
    securityFeatures: "",
    highAvailability: false,
    intrusionPrevention: false,
    // Repeater specific
    signalBoost: "",
    coverageArea: "",
    dualBand: false,
    // Other device specific
    deviceFunction: "",
    powerConsumption: "",
    rackMountable: false
  });

  const fetchDevices = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {});
      if ((response.data as any).success) {
        setDevices((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching devices:", error);
      toast.error("Failed to load network devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const deviceTypes = [
    {
      type: "switch",
      name: "Network Switch",
      icon: "🔀",
      description: "Add a network switch for LAN connectivity",
      setupUrl: "/dashboard/network-devices/switches"
    },
    {
      type: "access-point",
      name: "Access Point",
      icon: "📶",
      description: "Add a wireless access point for WiFi coverage",
      setupUrl: "/dashboard/network-devices/access-points"
    },
    {
      type: "router",
      name: "Router",
      icon: "🌐",
      description: "Add a router for network routing and gateway",
      setupUrl: "/dashboard/network-devices/routers"
    },
    {
      type: "firewall",
      name: "Firewall",
      icon: "🛡️",
      description: "Add a firewall for network security and access control",
      setupUrl: "/dashboard/network-devices/firewalls"
    },
    {
      type: "repeater",
      name: "Repeater",
      icon: "📡",
      description: "Add a signal repeater or network extender",
      setupUrl: "/dashboard/network-devices/repeaters"
    },
    {
      type: "other",
      name: "Other Device",
      icon: "🔧",
      description: "Add other specialized network equipment",
      setupUrl: "/dashboard/network-devices/other"
    }
  ];

  const resetForm = () => {
    setFormData({
      name: "",
      type: "",
      brand: "",
      model: "",
      ip: "",
      location: "",
      description: "",
      // Switch specific
      ports: "",
      poeSupport: "",
      poeWattage: "",
      managedType: "",
      vlanSupport: false,
      stackable: false,
      // Access Point specific
      wifiStandard: "",
      frequency: "",
      maxClients: "",
      antennaType: "",
      powerOutput: "",
      beamforming: false,
      // Router specific
      wanPorts: "",
      lanPorts: "",
      routingProtocols: "",
      vpnSupport: false,
      firewallBuiltin: false,
      bandwidth: "",
      // Firewall specific
      throughput: "",
      maxConnections: "",
      vpnTunnels: "",
      securityFeatures: "",
      highAvailability: false,
      intrusionPrevention: false,
      // Repeater specific
      signalBoost: "",
      coverageArea: "",
      dualBand: false,
      // Other device specific
      deviceFunction: "",
      powerConsumption: "",
      rackMountable: false
    });
    setSelectedDeviceType(null);
    setIsAddDialogOpen(false);
  };

  const renderDeviceSpecificFields = () => {
    if (!selectedDeviceType) return null;

    switch (selectedDeviceType) {
      case "switch":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              🔀 Switch Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Number of Ports *</Label>
                <Select 
                  value={formData.ports} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ports: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select port count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 Ports</SelectItem>
                    <SelectItem value="16">16 Ports</SelectItem>
                    <SelectItem value="24">24 Ports</SelectItem>
                    <SelectItem value="48">48 Ports</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>PoE Support</Label>
                <Select 
                  value={formData.poeSupport} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, poeSupport: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="PoE type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No PoE</SelectItem>
                    <SelectItem value="poe">PoE (15.4W)</SelectItem>
                    <SelectItem value="poe+">PoE+ (30W)</SelectItem>
                    <SelectItem value="poe++">PoE++ (60W)</SelectItem>
                    <SelectItem value="uhpoe">UHPoE (90W)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Total PoE Wattage</Label>
                <Input
                  placeholder="e.g., 370W"
                  value={formData.poeWattage}
                  onChange={(e) => setFormData(prev => ({ ...prev, poeWattage: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Management Type</Label>
                <Select 
                  value={formData.managedType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, managedType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Management type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unmanaged">Unmanaged</SelectItem>
                    <SelectItem value="smart">Smart Managed</SelectItem>
                    <SelectItem value="fully-managed">Fully Managed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>VLAN Support</Label>
                  <p className="text-xs text-muted-foreground">Virtual LAN configuration support</p>
                </div>
                <Switch 
                  checked={formData.vlanSupport}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vlanSupport: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Stackable</Label>
                  <p className="text-xs text-muted-foreground">Can be stacked with other switches</p>
                </div>
                <Switch 
                  checked={formData.stackable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, stackable: checked }))}
                />
              </div>
            </div>
          </div>
        );

      case "access-point":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              📶 Access Point Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>WiFi Standard *</Label>
                <Select 
                  value={formData.wifiStandard} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, wifiStandard: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="WiFi standard" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wifi4">WiFi 4 (802.11n)</SelectItem>
                    <SelectItem value="wifi5">WiFi 5 (802.11ac)</SelectItem>
                    <SelectItem value="wifi6">WiFi 6 (802.11ax)</SelectItem>
                    <SelectItem value="wifi6e">WiFi 6E</SelectItem>
                    <SelectItem value="wifi7">WiFi 7 (802.11be)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Frequency Bands</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Frequency bands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2.4ghz">2.4 GHz only</SelectItem>
                    <SelectItem value="5ghz">5 GHz only</SelectItem>
                    <SelectItem value="dual-band">Dual Band (2.4/5 GHz)</SelectItem>
                    <SelectItem value="tri-band">Tri Band (2.4/5/6 GHz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Max Concurrent Clients</Label>
                <Input
                  placeholder="e.g., 200"
                  value={formData.maxClients}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxClients: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Antenna Type</Label>
                <Select 
                  value={formData.antennaType} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, antennaType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Antenna type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">Internal Antennas</SelectItem>
                    <SelectItem value="external">External Antennas</SelectItem>
                    <SelectItem value="omni">Omnidirectional</SelectItem>
                    <SelectItem value="directional">Directional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label>Power Output</Label>
              <Input
                placeholder="e.g., 30 dBm"
                value={formData.powerOutput}
                onChange={(e) => setFormData(prev => ({ ...prev, powerOutput: e.target.value }))}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Beamforming</Label>
                  <p className="text-xs text-muted-foreground">Advanced antenna technology for better coverage</p>
                </div>
                <Switch 
                  checked={formData.beamforming}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, beamforming: checked }))}
                />
              </div>
            </div>
          </div>
        );

      case "router":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              🌐 Router Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>WAN Ports</Label>
                <Input
                  placeholder="e.g., 1"
                  value={formData.wanPorts}
                  onChange={(e) => setFormData(prev => ({ ...prev, wanPorts: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>LAN Ports</Label>
                <Input
                  placeholder="e.g., 4"
                  value={formData.lanPorts}
                  onChange={(e) => setFormData(prev => ({ ...prev, lanPorts: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Bandwidth Capacity</Label>
                <Input
                  placeholder="e.g., 1 Gbps"
                  value={formData.bandwidth}
                  onChange={(e) => setFormData(prev => ({ ...prev, bandwidth: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Routing Protocols</Label>
                <Input
                  placeholder="e.g., OSPF, BGP, RIP"
                  value={formData.routingProtocols}
                  onChange={(e) => setFormData(prev => ({ ...prev, routingProtocols: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>VPN Support</Label>
                  <p className="text-xs text-muted-foreground">Virtual Private Network capabilities</p>
                </div>
                <Switch 
                  checked={formData.vpnSupport}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, vpnSupport: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Built-in Firewall</Label>
                  <p className="text-xs text-muted-foreground">Integrated firewall functionality</p>
                </div>
                <Switch 
                  checked={formData.firewallBuiltin}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, firewallBuiltin: checked }))}
                />
              </div>
            </div>
          </div>
        );

      case "firewall":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              🛡️ Firewall Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Throughput *</Label>
                <Input
                  placeholder="e.g., 10 Gbps"
                  value={formData.throughput}
                  onChange={(e) => setFormData(prev => ({ ...prev, throughput: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Max Concurrent Connections</Label>
                <Input
                  placeholder="e.g., 1,000,000"
                  value={formData.maxConnections}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxConnections: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>VPN Tunnels</Label>
                <Input
                  placeholder="e.g., 100"
                  value={formData.vpnTunnels}
                  onChange={(e) => setFormData(prev => ({ ...prev, vpnTunnels: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Security Features</Label>
                <Input
                  placeholder="e.g., DPI, IPS, Anti-malware"
                  value={formData.securityFeatures}
                  onChange={(e) => setFormData(prev => ({ ...prev, securityFeatures: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Availability</Label>
                  <p className="text-xs text-muted-foreground">Failover and redundancy support</p>
                </div>
                <Switch 
                  checked={formData.highAvailability}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, highAvailability: checked }))}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Intrusion Prevention</Label>
                  <p className="text-xs text-muted-foreground">IPS/IDS capabilities</p>
                </div>
                <Switch 
                  checked={formData.intrusionPrevention}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, intrusionPrevention: checked }))}
                />
              </div>
            </div>
          </div>
        );

      case "repeater":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              📡 Repeater Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Signal Boost</Label>
                <Input
                  placeholder="e.g., 30 dBm"
                  value={formData.signalBoost}
                  onChange={(e) => setFormData(prev => ({ ...prev, signalBoost: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Coverage Area</Label>
                <Input
                  placeholder="e.g., 300 meters"
                  value={formData.coverageArea}
                  onChange={(e) => setFormData(prev => ({ ...prev, coverageArea: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dual Band Support</Label>
                  <p className="text-xs text-muted-foreground">2.4 GHz and 5 GHz frequency bands</p>
                </div>
                <Switch 
                  checked={formData.dualBand}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, dualBand: checked }))}
                />
              </div>
            </div>
          </div>
        );

      case "other":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              🔧 Device Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Device Function</Label>
                <Input
                  placeholder="e.g., Load Balancer, Media Converter"
                  value={formData.deviceFunction}
                  onChange={(e) => setFormData(prev => ({ ...prev, deviceFunction: e.target.value }))}
                />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Power Consumption</Label>
                <Input
                  placeholder="e.g., 25W"
                  value={formData.powerConsumption}
                  onChange={(e) => setFormData(prev => ({ ...prev, powerConsumption: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rack Mountable</Label>
                  <p className="text-xs text-muted-foreground">Can be mounted in a standard 19" rack</p>
                </div>
                <Switch 
                  checked={formData.rackMountable}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, rackMountable: checked }))}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.type) {
      toast.error("Device name and type are required");
      return;
    }

    try {
      const deviceData = {
        ...formData,
        icon: getIconByType(formData.type),
        monitoring: true
      };

      const response = await axios.post("/api/network-devices/add", deviceData);
      
      if ((response.data as any).success) {
        toast.success("Device added successfully");
        resetForm();
        fetchDevices();
      } else {
        toast.error("Failed to add device");
      }
    } catch (error) {
      console.error("Error adding device:", error);
      toast.error("Failed to add device");
    }
  };

  const getIconByType = (type: string) => {
    const iconMap: { [key: string]: string } = {
      "switch": "switch",
      "access-point": "wifi",
      "router": "router",
      "firewall": "shield",
      "repeater": "radio",
      "other": "network"
    };
    return iconMap[type] || "network";
  };



  if (loading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-64">
            <div className="text-lg">Loading network devices...</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Toaster />
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <h1>Dashboard</h1>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Network Devices</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header with Add Button */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Network Devices</h1>
              <p className="text-muted-foreground">
                {devices.length === 0 
                  ? "Add your first network device to get started" 
                  : `Manage your network infrastructure (${devices.length} devices)`
                }
              </p>
            </div>
            
            <AlertDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <Plus className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="max-w-[90vw] w-[800px] max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>Add New Network Device</AlertDialogTitle>
                  <AlertDialogDescription>
                    Choose what type of network device you want to add
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                {!selectedDeviceType ? (
                  <div className="space-y-3 py-4">
                    {deviceTypes.map((deviceType) => (
                      <div
                        key={deviceType.type}
                        className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => {
                          setSelectedDeviceType(deviceType.type);
                          setFormData(prev => ({ ...prev, type: deviceType.type }));
                        }}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <span className="text-xl">{deviceType.icon}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{deviceType.name}</h3>
                          <p className="text-sm text-muted-foreground">{deviceType.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedDeviceType(null);
                          setFormData(prev => ({ ...prev, type: "" }));
                        }}
                      >
                        ← Back
                      </Button>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{deviceTypes.find(d => d.type === selectedDeviceType)?.icon}</span>
                        <span className="font-semibold">{deviceTypes.find(d => d.type === selectedDeviceType)?.name}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid w-full items-center gap-1.5">
                        <Label>Device Name *</Label>
                        <Input
                          placeholder={`e.g., Main ${deviceTypes.find(d => d.type === selectedDeviceType)?.name}`}
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Brand <span className="text-stone-600">(optional)</span></Label>
                          <Input
                            placeholder="e.g., Cisco"
                            value={formData.brand}
                            onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                          />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Model <span className="text-stone-600">(optional)</span></Label>
                          <Input
                            placeholder="e.g., SG350-28"
                            value={formData.model}
                            onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                          <Label>IP Address <span className="text-stone-600">(optional)</span></Label>
                          <Input
                            placeholder="192.168.1.10"
                            value={formData.ip}
                            onChange={(e) => setFormData(prev => ({ ...prev, ip: e.target.value }))}
                          />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                          <Label>Location <span className="text-stone-600">(optional)</span></Label>
                          <Input
                            placeholder="e.g., Server Room"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                        <Label>Description <span className="text-stone-600">(optional)</span></Label>
                        <Textarea
                          placeholder="Device description..."
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                    </div>
                    
                    {/* Device-specific configuration fields */}
                    {renderDeviceSpecificFields()}
                  </div>
                )}

                <AlertDialogFooter>
                  {!selectedDeviceType ? (
                    <AlertDialogCancel onClick={resetForm}>Cancel</AlertDialogCancel>
                  ) : (
                    <>
                      <AlertDialogCancel onClick={resetForm}>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleSubmit}
                        disabled={!formData.name}
                      >
                        Add {deviceTypes.find(d => d.type === selectedDeviceType)?.name}
                      </AlertDialogAction>
                    </>
                  )}
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {devices.length === 0 ? (
            /* Empty State */
            <Card className="border-dashed border-2 border-muted-foreground/25">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-xl font-semibold mb-2">No Network Devices</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Get started by adding your first network device. You can add switches, access points, routers, firewalls, and more.
                </p>
                <Button 
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Device
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Devices with Navbar */
            <>
              {/* Device Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📊 Network Infrastructure Overview
                  </CardTitle>
                  <CardDescription>
                    Total devices: {devices.length} | Online: {devices.filter(d => d.online).length} | Monitored: {devices.filter(d => d.monitoring).length}
                  </CardDescription>
                </CardHeader>
              </Card>

              {/* Navbar/Tabs for Device Types */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="all">All ({devices.length})</TabsTrigger>
                  <TabsTrigger value="switch">
                    🔀 Switches ({devices.filter(d => d.type === 'switch').length})
                  </TabsTrigger>
                  <TabsTrigger value="access-point">
                    📶 APs ({devices.filter(d => d.type === 'access-point').length})
                  </TabsTrigger>
                  <TabsTrigger value="router">
                    🌐 Routers ({devices.filter(d => d.type === 'router').length})
                  </TabsTrigger>
                  <TabsTrigger value="firewall">
                    🛡️ Firewalls ({devices.filter(d => d.type === 'firewall').length})
                  </TabsTrigger>
                  <TabsTrigger value="other">
                    🔧 Other ({devices.filter(d => d.type === 'repeater' || d.type === 'other').length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="mt-4">
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {devices.map((device) => (
                      <Card key={device.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {deviceTypes.find(dt => dt.type === device.type)?.icon || '🔧'}
                              </span>
                              <h4 className="font-semibold text-sm">{device.name}</h4>
                            </div>
                            <div className="flex gap-1">
                              <Badge variant={device.online ? "default" : "destructive"} className="text-xs">
                                {device.online ? "Online" : "Offline"}
                              </Badge>
                              {device.monitoring && (
                                <Badge variant="outline" className="text-xs">Monitored</Badge>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div>Type: {deviceTypes.find(dt => dt.type === device.type)?.name || device.type}</div>
                            {device.brand && <div>Brand: {device.brand}</div>}
                            {device.model && <div>Model: {device.model}</div>}
                            {device.ip && <div>IP: {device.ip}</div>}
                            {device.location && <div>Location: {device.location}</div>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                {deviceTypes.map((deviceType) => (
                  <TabsContent key={deviceType.type} value={deviceType.type} className="mt-4">
                    {devices.filter(d => d.type === deviceType.type).length === 0 ? (
                      <Card className="border-dashed border-2 border-muted-foreground/25">
                        <CardContent className="flex flex-col items-center justify-center py-12">
                          <div className="text-4xl mb-4">{deviceType.icon}</div>
                          <h3 className="text-lg font-semibold mb-2">No {deviceType.name}s</h3>
                          <p className="text-muted-foreground text-center mb-4">
                            {deviceType.description}
                          </p>
                          <Button 
                            onClick={() => {
                              setSelectedDeviceType(deviceType.type);
                              setFormData(prev => ({ ...prev, type: deviceType.type }));
                              setIsAddDialogOpen(true);
                            }}
                            variant="outline"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add {deviceType.name}
                          </Button>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {devices.filter(d => d.type === deviceType.type).map((device) => (
                          <Card key={device.id}>
                            <CardContent className="pt-6">
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{deviceType.icon}</span>
                                  <h4 className="font-semibold text-sm">{device.name}</h4>
                                </div>
                                <div className="flex gap-1">
                                  <Badge variant={device.online ? "default" : "destructive"} className="text-xs">
                                    {device.online ? "Online" : "Offline"}
                                  </Badge>
                                  {device.monitoring && (
                                    <Badge variant="outline" className="text-xs">Monitored</Badge>
                                  )}
                                </div>
                              </div>
                              <div className="space-y-1 text-xs text-muted-foreground">
                                {device.brand && <div>Brand: {device.brand}</div>}
                                {device.model && <div>Model: {device.model}</div>}
                                {device.ip && <div>IP: {device.ip}</div>}
                                {device.location && <div>Location: {device.location}</div>}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                ))}

                <TabsContent value="other" className="mt-4">
                  {devices.filter(d => d.type === 'repeater' || d.type === 'other').length === 0 ? (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <div className="text-4xl mb-4">🔧</div>
                        <h3 className="text-lg font-semibold mb-2">No Other Devices</h3>
                        <p className="text-muted-foreground text-center mb-4">
                          Repeaters and other specialized network equipment
                        </p>
                        <Button 
                          onClick={() => setIsAddDialogOpen(true)}
                          variant="outline"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Device
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {devices.filter(d => d.type === 'repeater' || d.type === 'other').map((device) => (
                        <Card key={device.id}>
                          <CardContent className="pt-6">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">
                                  {deviceTypes.find(dt => dt.type === device.type)?.icon || '🔧'}
                                </span>
                                <h4 className="font-semibold text-sm">{device.name}</h4>
                              </div>
                              <div className="flex gap-1">
                                <Badge variant={device.online ? "default" : "destructive"} className="text-xs">
                                  {device.online ? "Online" : "Offline"}
                                </Badge>
                                {device.monitoring && (
                                  <Badge variant="outline" className="text-xs">Monitored</Badge>
                                )}
                              </div>
                            </div>
                            <div className="space-y-1 text-xs text-muted-foreground">
                              <div>Type: {deviceTypes.find(dt => dt.type === device.type)?.name || device.type}</div>
                              {device.brand && <div>Brand: {device.brand}</div>}
                              {device.model && <div>Model: {device.model}</div>}
                              {device.ip && <div>IP: {device.ip}</div>}
                              {device.location && <div>Location: {device.location}</div>}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
} 