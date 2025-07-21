"use client"

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
import { Button } from "@/components/ui/button"
import {
  Plus,
  Link as LinkIcon,
  MonitorIcon as MonitorCog,
  FileDigit,
  Trash2,
  LayoutGrid,
  List,
  Pencil,
  Router,
  Wifi,
  Shield,
  Radio,
  Network,
  History,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Copy,
  Zap,
} from "lucide-react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
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
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Cookies from "js-cookie"
import { useState, useEffect, useRef } from "react"
import axios from "axios"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DynamicIcon } from "lucide-react/dynamic"
import { StatusIndicator } from "@/components/status-indicator"
import NextLink from "next/link"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"

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
  icon?: string;
  uptime?: string;
  createdAt: string;
  // Device-specific properties for display
  ports?: string;
  poeSupport?: string;
  poeWattage?: string;
  managedType?: string;
  vlanSupport?: boolean;
  stackable?: boolean;
  wifiStandard?: string;
  frequency?: string;
  maxClients?: string;
  antennaType?: string;
  powerOutput?: string;
  beamforming?: boolean;
  wanPorts?: string;
  lanPorts?: string;
  routingProtocols?: string;
  vpnSupport?: boolean;
  firewallBuiltin?: boolean;
  bandwidth?: string;
  throughput?: string;
  maxConnections?: string;
  vpnTunnels?: string;
  securityFeatures?: string;
  highAvailability?: boolean;
  intrusionPrevention?: boolean;
  signalBoost?: string;
  coverageArea?: string;
  dualBand?: boolean;
  deviceFunction?: string;
  powerConsumption?: string;
  rackMountable?: boolean;
}

interface GetNetworkDevicesResponse {
  devices: NetworkDevice[]
  maxPage: number
  totalItems: number
}

interface MonitoringData {
  id: number
  online: boolean
  uptime: string
  responseTime: number
  lastChecked: string
  packetLoss?: number
  bandwidth?: string
}

export default function NetworkDevices() {
  const t = useTranslations()
  const [devices, setDevices] = useState<NetworkDevice[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [maxPage, setMaxPage] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Form states for adding devices
  const [name, setName] = useState<string>("")
  const [type, setType] = useState<string>("")
  const [brand, setBrand] = useState<string>("")
  const [model, setModel] = useState<string>("")
  const [ip, setIp] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [monitoring, setMonitoring] = useState<boolean>(true)

  // Device-specific form states
  const [ports, setPorts] = useState<string>("")
  const [poeSupport, setPoeSupport] = useState<string>("")
  const [poeWattage, setPoeWattage] = useState<string>("")
  const [managedType, setManagedType] = useState<string>("")
  const [vlanSupport, setVlanSupport] = useState<boolean>(false)
  const [stackable, setStackable] = useState<boolean>(false)
  const [wifiStandard, setWifiStandard] = useState<string>("")
  const [frequency, setFrequency] = useState<string>("")
  const [maxClients, setMaxClients] = useState<string>("")
  const [antennaType, setAntennaType] = useState<string>("")
  const [powerOutput, setPowerOutput] = useState<string>("")
  const [beamforming, setBeamforming] = useState<boolean>(false)
  const [wanPorts, setWanPorts] = useState<string>("")
  const [lanPorts, setLanPorts] = useState<string>("")
  const [routingProtocols, setRoutingProtocols] = useState<string>("")
  const [vpnSupport, setVpnSupport] = useState<boolean>(false)
  const [firewallBuiltin, setFirewallBuiltin] = useState<boolean>(false)
  const [bandwidth, setBandwidth] = useState<string>("")
  const [throughput, setThroughput] = useState<string>("")
  const [maxConnections, setMaxConnections] = useState<string>("")
  const [vpnTunnels, setVpnTunnels] = useState<string>("")
  const [securityFeatures, setSecurityFeatures] = useState<string>("")
  const [highAvailability, setHighAvailability] = useState<boolean>(false)
  const [intrusionPrevention, setIntrusionPrevention] = useState<boolean>(false)
  const [signalBoost, setSignalBoost] = useState<string>("")
  const [coverageArea, setCoverageArea] = useState<string>("")
  const [dualBand, setDualBand] = useState<boolean>(false)
  const [deviceFunction, setDeviceFunction] = useState<string>("")
  const [powerConsumption, setPowerConsumption] = useState<string>("")
  const [rackMountable, setRackMountable] = useState<boolean>(false)

  // Edit form states
  const [editId, setEditId] = useState<number | null>(null)
  const [editName, setEditName] = useState<string>("")
  const [editType, setEditType] = useState<string>("")
  const [editBrand, setEditBrand] = useState<string>("")
  const [editModel, setEditModel] = useState<string>("")
  const [editIp, setEditIp] = useState<string>("")
  const [editLocation, setEditLocation] = useState<string>("")
  const [editDescription, setEditDescription] = useState<string>("")
  const [editMonitoring, setEditMonitoring] = useState<boolean>(true)

  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isSearching, setIsSearching] = useState<boolean>(false)

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false)
  const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"all" | "switch" | "access-point" | "router" | "firewall" | "other">("all")

  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);

  const savedLayout = Cookies.get("layoutPreference-network-devices");
  const savedItemsPerPage = Cookies.get("itemsPerPage-network-devices");
  const initialIsGridLayout = savedLayout === "grid";
  const defaultItemsPerPage = initialIsGridLayout ? 6 : 4;
  const initialItemsPerPage = savedItemsPerPage ? parseInt(savedItemsPerPage) : defaultItemsPerPage;

  const [isGridLayout, setIsGridLayout] = useState<boolean>(initialIsGridLayout);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);
  const customInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleLayout = (gridLayout: boolean) => {
    setIsGridLayout(gridLayout);
    Cookies.set("layoutPreference-network-devices", gridLayout ? "grid" : "standard", {
      expires: 365,
      path: "/",
      sameSite: "strict",
    });
  };

  const deviceTypes = [
    {
      type: "switch",
      name: "Network Switch",
      icon: "network",
      description: "Add a network switch for LAN connectivity"
    },
    {
      type: "access-point",
      name: "Access Point",
      icon: "wifi",
      description: "Add a wireless access point for WiFi coverage"
    },
    {
      type: "router",
      name: "Router",
      icon: "router",
      description: "Add a router for network routing and gateway"
    },
    {
      type: "firewall",
      name: "Firewall",
      icon: "shield",
      description: "Add a firewall for network security and access control"
    },
    {
      type: "repeater",
      name: "Repeater",
      icon: "radio",
      description: "Add a signal repeater or network extender"
    },
    {
      type: "other",
      name: "Other Device",
      icon: "settings",
      description: "Add other specialized network equipment"
    }
  ];

  const iconCategories = {
    Infrastructure: ["network", "router", "wifi", "radio", "antenna"],
    Security: ["shield", "lock", "key", "fingerprint", "scan-face"],
    Status: ["check-circle", "x-octagon", "alert-triangle", "alarm-check", "life-buoy"],
    Other: [
      "settings",
      "power",
      "folder",
      "file-code",
      "clipboard-list",
      "git-branch",
      "git-commit",
      "git-merge",
      "git-pull-request",
      "github",
      "bug",
    ],
  }

  const getIconByType = (deviceType: string) => {
    const iconMap: { [key: string]: string } = {
      "switch": "network",
      "access-point": "wifi",
      "router": "router",
      "firewall": "shield",
      "repeater": "radio",
      "other": "settings"
    };
    return iconMap[deviceType] || "network";
  };

  const add = async () => {
    try {
      const deviceData = {
        name,
        type,
        brand,
        model,
        ip,
        location,
        description,
        monitoring,
        icon: getIconByType(type),
        // Device-specific fields
        ports,
        poeSupport,
        poeWattage,
        managedType,
        vlanSupport,
        stackable,
        wifiStandard,
        frequency,
        maxClients,
        antennaType,
        powerOutput,
        beamforming,
        wanPorts,
        lanPorts,
        routingProtocols,
        vpnSupport,
        firewallBuiltin,
        bandwidth,
        throughput,
        maxConnections,
        vpnTunnels,
        securityFeatures,
        highAvailability,
        intrusionPrevention,
        signalBoost,
        coverageArea,
        dualBand,
        deviceFunction,
        powerConsumption,
        rackMountable,
      }

      await axios.post("/api/network-devices/add", deviceData)
      setIsAddDialogOpen(false)
      resetForm()
      getDevices()
      toast.success("Network device added successfully");
    } catch (error: any) {
      console.log(error.response?.data)
      toast.error("Failed to add network device");
    }
  }

  const resetForm = () => {
    setName("")
    setType("")
    setBrand("")
    setModel("")
    setIp("")
    setLocation("")
    setDescription("")
    setMonitoring(true)
    setPorts("")
    setPoeSupport("")
    setPoeWattage("")
    setManagedType("")
    setVlanSupport(false)
    setStackable(false)
    setWifiStandard("")
    setFrequency("")
    setMaxClients("")
    setAntennaType("")
    setPowerOutput("")
    setBeamforming(false)
    setWanPorts("")
    setLanPorts("")
    setRoutingProtocols("")
    setVpnSupport(false)
    setFirewallBuiltin(false)
    setBandwidth("")
    setThroughput("")
    setMaxConnections("")
    setVpnTunnels("")
    setSecurityFeatures("")
    setHighAvailability(false)
    setIntrusionPrevention(false)
    setSignalBoost("")
    setCoverageArea("")
    setDualBand(false)
    setDeviceFunction("")
    setPowerConsumption("")
    setRackMountable(false)
    setSelectedDeviceType(null)
  }

  const getDevices = async () => {
    try {
      setLoading(true)
      const response = await axios.post<GetNetworkDevicesResponse>("/api/network-devices/get", {
        page: currentPage,
        ITEMS_PER_PAGE: itemsPerPage,
      })
      
      setDevices(response.data.devices)
      setMaxPage(response.data.maxPage)
      setTotalItems(response.data.totalItems)
      setLoading(false)
    } catch (error: any) {
      console.log(error.response)
      toast.error("Failed to fetch network devices");
      setLoading(false)
    }
  }

  useEffect(() => {
    getDevices()
  }, [currentPage, itemsPerPage])

  const handlePrevious = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(maxPage, prev + 1))
  }

  const deleteDevice = async (id: number) => {
    try {
      await axios.post("/api/network-devices/delete", { id })
      toast.success("Network device deleted successfully");
      getDevices()
    } catch (error: any) {
      console.log(error.response?.data)
      toast.error("Failed to delete network device");
    }
  }

  const openEditDialog = (device: NetworkDevice) => {
    setEditId(device.id)
    setEditName(device.name)
    setEditType(device.type)
    setEditBrand(device.brand || "")
    setEditModel(device.model || "")
    setEditIp(device.ip || "")
    setEditLocation(device.location || "")
    setEditDescription(device.description || "")
    setEditMonitoring(device.monitoring)
  }

  const edit = async () => {
    if (!editId) return

    try {
      await axios.put("/api/network-devices/edit", {
        id: editId,
        name: editName,
        type: editType,
        brand: editBrand,
        model: editModel,
        ip: editIp,
        location: editLocation,
        description: editDescription,
        monitoring: editMonitoring,
      })
      getDevices()
      setEditId(null)
      toast.success("Network device updated successfully");
    } catch (error: any) {
      console.log(error.response?.data)
      toast.error("Failed to update network device");
    }
  }

  const searchDevices = async () => {
    try {
      setIsSearching(true)
      const response = await axios.post<{ results: NetworkDevice[] }>("/api/network-devices/search", { 
        searchterm: searchTerm 
      })
      
      setDevices(response.data.results)
      setMaxPage(1)
      setIsSearching(false)
    } catch (error: any) {
      console.error("Search error:", error.response?.data)
      setIsSearching(false)
    }
  }

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() === "") {
        getDevices()
      } else {
        searchDevices()
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [searchTerm])

  const copyDeviceDetails = (sourceDevice: NetworkDevice) => {
    resetForm()
    
    setTimeout(() => {
      setName(sourceDevice.name + " (Copy)")
      setType(sourceDevice.type)
      setBrand(sourceDevice.brand || "")
      setModel(sourceDevice.model || "")
      setIp(sourceDevice.ip || "")
      setLocation(sourceDevice.location || "")
      setDescription(sourceDevice.description || "")
      setMonitoring(sourceDevice.monitoring)
    }, 0)
  }

  const updateMonitoringData = async () => {
    try {
      const response = await axios.get<MonitoringData[]>("/api/network-devices/monitoring");
      const monitoringData = response.data;

      setDevices(prevDevices => 
        prevDevices.map(device => {
          const deviceMonitoring = monitoringData.find(m => m.id === device.id);
          if (deviceMonitoring) {
            return {
              ...device,
              online: deviceMonitoring.online,
              uptime: deviceMonitoring.uptime,
            };
          }
          return device;
        })
      );
    } catch (error) {
      console.error("Error updating monitoring data:", error);
    }
  };

  useEffect(() => {
    updateMonitoringData();
    const interval = setInterval(updateMonitoringData, 10000); // Update every 10 seconds
    setMonitoringInterval(interval);

    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, []);

  const handleItemsPerPageChange = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const newItemsPerPage = parseInt(value);
      
      if (isNaN(newItemsPerPage) || newItemsPerPage < 1) {
        toast.error("Please enter a number between 1 and 100");
        return;
      }
      
      const validatedValue = Math.min(Math.max(newItemsPerPage, 1), 100);
      
      setItemsPerPage(validatedValue);
      setCurrentPage(1);
      Cookies.set("itemsPerPage-network-devices", String(validatedValue), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
      
      getDevices();
    }, 600);
  };

  const handlePresetItemsPerPageChange = (value: string) => {
    const newItemsPerPage = parseInt(value);
    
    if ([4, 6, 10, 15, 20, 25].includes(newItemsPerPage)) {
      setItemsPerPage(newItemsPerPage);
      setCurrentPage(1);
      Cookies.set("itemsPerPage-network-devices", String(newItemsPerPage), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
      
      getDevices();
    } else {
      handleItemsPerPageChange(value);
    }
  };

  const renderDeviceSpecificFields = () => {
    if (!selectedDeviceType) return null;

    switch (selectedDeviceType) {
      case "switch":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Network className="h-4 w-4" /> Switch Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Number of Ports</Label>
                <Select value={ports} onValueChange={setPorts}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select port count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="8">8 Ports</SelectItem>
                    <SelectItem value="16">16 Ports</SelectItem>
                    <SelectItem value="24">24 Ports</SelectItem>
                    <SelectItem value="48">48 Ports</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>PoE Support</Label>
                <Select value={poeSupport} onValueChange={setPoeSupport}>
                  <SelectTrigger>
                    <SelectValue placeholder="PoE type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No PoE</SelectItem>
                    <SelectItem value="poe">PoE (15.4W)</SelectItem>
                    <SelectItem value="poe+">PoE+ (30W)</SelectItem>
                    <SelectItem value="poe++">PoE++ (60W)</SelectItem>
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
                <Switch checked={vlanSupport} onCheckedChange={setVlanSupport} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Stackable</Label>
                  <p className="text-xs text-muted-foreground">Can be stacked with other switches</p>
                </div>
                <Switch checked={stackable} onCheckedChange={setStackable} />
              </div>
            </div>
          </div>
        );

      case "access-point":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Wifi className="h-4 w-4" /> Access Point Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>WiFi Standard</Label>
                <Select value={wifiStandard} onValueChange={setWifiStandard}>
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
                <Select value={frequency} onValueChange={setFrequency}>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Beamforming</Label>
                  <p className="text-xs text-muted-foreground">Advanced antenna technology for better coverage</p>
                </div>
                <Switch checked={beamforming} onCheckedChange={setBeamforming} />
              </div>
            </div>
          </div>
        );

      case "router":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Router className="h-4 w-4" /> Router Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>WAN Ports</Label>
                <Input placeholder="e.g., 1" value={wanPorts} onChange={(e) => setWanPorts(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>LAN Ports</Label>
                <Input placeholder="e.g., 4" value={lanPorts} onChange={(e) => setLanPorts(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>VPN Support</Label>
                  <p className="text-xs text-muted-foreground">Virtual Private Network capabilities</p>
                </div>
                <Switch checked={vpnSupport} onCheckedChange={setVpnSupport} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Built-in Firewall</Label>
                  <p className="text-xs text-muted-foreground">Integrated firewall functionality</p>
                </div>
                <Switch checked={firewallBuiltin} onCheckedChange={setFirewallBuiltin} />
              </div>
            </div>
          </div>
        );

      case "firewall":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Shield className="h-4 w-4" /> Firewall Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Throughput</Label>
                <Input placeholder="e.g., 10 Gbps" value={throughput} onChange={(e) => setThroughput(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Max Connections</Label>
                <Input placeholder="e.g., 1,000,000" value={maxConnections} onChange={(e) => setMaxConnections(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>High Availability</Label>
                  <p className="text-xs text-muted-foreground">Failover and redundancy support</p>
                </div>
                <Switch checked={highAvailability} onCheckedChange={setHighAvailability} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Intrusion Prevention</Label>
                  <p className="text-xs text-muted-foreground">IPS/IDS capabilities</p>
                </div>
                <Switch checked={intrusionPrevention} onCheckedChange={setIntrusionPrevention} />
              </div>
            </div>
          </div>
        );

      case "repeater":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <Radio className="h-4 w-4" /> Repeater Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Signal Boost</Label>
                <Input placeholder="e.g., 30 dBm" value={signalBoost} onChange={(e) => setSignalBoost(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Coverage Area</Label>
                <Input placeholder="e.g., 300 meters" value={coverageArea} onChange={(e) => setCoverageArea(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dual Band Support</Label>
                  <p className="text-xs text-muted-foreground">2.4 GHz and 5 GHz frequency bands</p>
                </div>
                <Switch checked={dualBand} onCheckedChange={setDualBand} />
              </div>
            </div>
          </div>
        );

      case "other":
        return (
          <div className="space-y-4 border-t pt-4">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <MonitorCog className="h-4 w-4" /> Device Configuration
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid w-full items-center gap-1.5">
                <Label>Device Function</Label>
                <Input placeholder="e.g., Load Balancer" value={deviceFunction} onChange={(e) => setDeviceFunction(e.target.value)} />
              </div>
              <div className="grid w-full items-center gap-1.5">
                <Label>Power Consumption</Label>
                <Input placeholder="e.g., 25W" value={powerConsumption} onChange={(e) => setPowerConsumption(e.target.value)} />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Rack Mountable</Label>
                  <p className="text-xs text-muted-foreground">Can be mounted in a standard 19&quot; rack</p>
                </div>
                <Switch checked={rackMountable} onCheckedChange={setRackMountable} />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

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
                  <BreadcrumbPage>My Infrastructure</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Network Devices</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Toaster />
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <span className="text-3xl font-bold">Your Network Devices</span>
            <div className="flex gap-2">              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title="Change View">
                    {isGridLayout ? (
                      <LayoutGrid className="h-4 w-4" />
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleLayout(false)}>
                    <List className="h-4 w-4 mr-2" /> List View
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleLayout(true)}>
                    <LayoutGrid className="h-4 w-4 mr-2" /> Grid View
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Select
                value={String(itemsPerPage)}
                onValueChange={handlePresetItemsPerPageChange}
                onOpenChange={(open) => {
                  if (open && customInputRef.current) {
                    customInputRef.current.value = String(itemsPerPage);
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {itemsPerPage} {itemsPerPage === 1 ? 'item' : 'items'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {![4, 6, 10, 15, 20, 25].includes(itemsPerPage) ? (
                    <SelectItem value={String(itemsPerPage)}>
                      {itemsPerPage} {itemsPerPage === 1 ? 'item' : 'items'} (Custom)
                    </SelectItem>
                  ) : null}
                  <SelectItem value="4">4 items</SelectItem>
                  <SelectItem value="6">6 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="15">15 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="25">25 items</SelectItem>
                  <div className="p-2 border-t mt-1">
                    <Label htmlFor="custom-items" className="text-xs font-medium">Custom</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="custom-items"
                        ref={customInputRef}
                        type="number"
                        min="1"
                        max="100"
                        className="h-8"
                        defaultValue={itemsPerPage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value < 1 || value > 100) {
                            e.target.classList.add("border-red-500");
                          } else {
                            e.target.classList.remove("border-red-500");
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleItemsPerPageChange(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (debounceTimerRef.current) {
                              clearTimeout(debounceTimerRef.current);
                              debounceTimerRef.current = null;
                            }
                            
                            const value = parseInt((e.target as HTMLInputElement).value);
                            if (value >= 1 && value <= 100) {
                              const validatedValue = Math.min(Math.max(value, 1), 100);
                              setItemsPerPage(validatedValue);
                              setCurrentPage(1);
                              Cookies.set("itemsPerPage-network-devices", String(validatedValue), {
                                expires: 365,
                                path: "/",
                                sameSite: "strict",
                              });
                              
                              setTimeout(() => {
                                getDevices();
                                document.body.click();
                              }, 50);
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">items</span>
            </div>
                  </div>
                </SelectContent>
              </Select>
            
              <AlertDialog onOpenChange={setIsSetupDialogOpen}>
              <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus />
                </Button>
              </AlertDialogTrigger>
                <AlertDialogContent className="max-w-md">
                <AlertDialogHeader>
                    <AlertDialogTitle>Add Network Device</AlertDialogTitle>
                  <AlertDialogDescription>
                      What type of network device would you like to add?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                  <div className="grid gap-4 py-4">
                    {deviceTypes.map((deviceType) => (
                      <div
                        key={deviceType.type}
                        className="flex items-center space-x-4 p-4 border rounded-lg cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          resetForm();
                          setSelectedDeviceType(deviceType.type);
                          setType(deviceType.type);
                          setIsSetupDialogOpen(false);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground">
                          <DynamicIcon name={deviceType.icon as any} className="h-6 w-6" />
                          </div>
                        <div>
                          <h3 className="font-semibold">{deviceType.name}</h3>
                          <p className="text-sm text-muted-foreground">{deviceType.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsSetupDialogOpen(false)}>
                      Cancel
                    </AlertDialogCancel>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <AlertDialogContent className="max-w-[95vw] w-[600px] max-h-[90vh] overflow-y-auto">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <span>Add {deviceTypes.find(d => d.type === selectedDeviceType)?.name}</span>
                      <Select 
                        onValueChange={(value) => {
                          if (!value) return;
                          const sourceDevice = devices.find(d => d.id === parseInt(value));
                          if (!sourceDevice) return;
                          
                          copyDeviceDetails(sourceDevice);
                        }}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Copy className="h-3 w-3 text-muted-foreground" />
                            <SelectValue placeholder="Copy Device" />
                      </div>
                        </SelectTrigger>
                        <SelectContent>
                          {devices.map((device) => (
                            <SelectItem key={device.id} value={device.id.toString()} className="text-sm">
                              {device.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      <Tabs defaultValue="general" className="w-full">
                        <TabsList className="w-full">
                          <TabsTrigger value="general">General</TabsTrigger>
                          <TabsTrigger value="specifications">Specifications</TabsTrigger>
                          <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                        </TabsList>
                        <TabsContent value="general">
                          <div className="space-y-4 pt-4">
                      <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="name">Device Name</Label>
                        <Input
                                id="name"
                                type="text"
                                placeholder="e.g. Main Switch"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="brand">Brand <span className="text-stone-600">(optional)</span></Label>
                          <Input
                                  id="brand"
                                  type="text"
                                  placeholder="e.g. Cisco"
                                  value={brand}
                                  onChange={(e) => setBrand(e.target.value)}
                          />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="model">Model <span className="text-stone-600">(optional)</span></Label>
                          <Input
                                  id="model"
                                  type="text"
                                  placeholder="e.g. SG350-28"
                                  value={model}
                                  onChange={(e) => setModel(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="ip">IP Address <span className="text-stone-600">(optional)</span></Label>
                          <Input
                                  id="ip"
                                  type="text"
                                  placeholder="e.g. 192.168.1.10"
                                  value={ip}
                                  onChange={(e) => setIp(e.target.value)}
                          />
                        </div>
                        <div className="grid w-full items-center gap-1.5">
                                <Label htmlFor="location">Location <span className="text-stone-600">(optional)</span></Label>
                          <Input
                                  id="location"
                                  type="text"
                                  placeholder="e.g. Server Room"
                                  value={location}
                                  onChange={(e) => setLocation(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid w-full items-center gap-1.5">
                              <Label htmlFor="description">Description <span className="text-stone-600">(optional)</span></Label>
                        <Textarea
                                id="description"
                          placeholder="Device description..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                        </TabsContent>
                        <TabsContent value="specifications">
                    {renderDeviceSpecificFields()}
                        </TabsContent>
                        <TabsContent value="monitoring">
                          <div className="space-y-4 pt-4">
                            <div className="flex items-center space-x-2">
                              <Switch
                                id="monitoringCheckbox"
                                checked={monitoring}
                                onCheckedChange={setMonitoring}
                              />
                              <Label htmlFor="monitoringCheckbox">Enable Monitoring</Label>
                  </div>
                            <div className="text-sm text-muted-foreground">
                              <p>Network device monitoring will track the online status and basic connectivity of this device.</p>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setIsAddDialogOpen(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={add}>Add Device</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="mb-6">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
                <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="switch">Switches</TabsTrigger>
                <TabsTrigger value="access-point">Access Points</TabsTrigger>
                <TabsTrigger value="router">Routers</TabsTrigger>
                <TabsTrigger value="firewall">Firewalls</TabsTrigger>
                <TabsTrigger value="other">Other</TabsTrigger>
                </TabsList>
            </Tabs>
          </div>

          <div className="flex flex-col gap-2 mb-4 pt-2">
            <Input
              id="device-search"
              placeholder="Search network devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <br />
          {!loading ? (
            <div className={isGridLayout ? "grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
              {devices
                .filter((device) => {
                  if (activeTab === "all") return true;
                  if (activeTab === "other") return device.type === "repeater" || device.type === "other";
                  return device.type === activeTab;
                })
                .map((device) => {
                  return (
                    <Card
                      key={device.id}
                      className={`${isGridLayout ? "h-full flex flex-col justify-between" : "w-full mb-4"} hover:shadow-md transition-all duration-200 max-w-full relative`}
                    >
                      <CardHeader>
                        {device.monitoring && (
                          <div className="absolute top-4 right-4 flex flex-col items-end">
                            <StatusIndicator isOnline={device.online} />
                            {device.online && device.uptime && device.uptime !== "Unknown" && !device.uptime.includes("Check") && (
                              <span className="text-xs text-muted-foreground mt-1">
                                up {device.uptime}
                              </span>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center w-full">
                            <div className="ml-4 flex-grow">
                              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                  {device.icon && (
                                    <DynamicIcon name={device.icon as any} size={24} />
                                  )}
                                  <span className="font-bold">
                                    {device.icon && "･"} {device.name}
                              </span>
                            </div>
                                <Badge variant={device.type === "firewall" ? "destructive" : "secondary"} className="text-xs">
                                  {deviceTypes.find(dt => dt.type === device.type)?.name || device.type}
                              </Badge>
                              </CardTitle>
                              <CardDescription
                                className={`text-sm mt-1 grid gap-y-1 ${
                                  isGridLayout ? "grid-cols-1" : "grid-cols-2 gap-x-4"
                                }`}
                              >
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <MonitorCog className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    <b>Type:</b> {deviceTypes.find(dt => dt.type === device.type)?.name || device.type}
                                  </span>
                                </div>
                                {device.brand && (
                                  <div className="flex items-center gap-2 text-foreground/80">
                                    <FileDigit className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      <b>Brand:</b> {device.brand}
                                    </span>
                                  </div>
                                )}
                                {device.model && (
                                  <div className="flex items-center gap-2 text-foreground/80">
                                    <FileDigit className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      <b>Model:</b> {device.model}
                                    </span>
                            </div>
                                )}
                                <div className="flex items-center gap-2 text-foreground/80">
                                  <FileDigit className="h-4 w-4 text-muted-foreground" />
                                  <span>
                                    <b>IP:</b> {device.ip || "Not set"}
                                  </span>
                          </div>
                                {device.location && (
                                  <div className="flex items-center gap-2 text-foreground/80">
                                    <FileDigit className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      <b>Location:</b> {device.location}
                                    </span>
                          </div>
                                )}

                                {device.description && (
                                  <>
                                    <div className="col-span-full pt-2 pb-2">
                                      <Separator />
                  </div>
                                    <div className="col-span-full">
                                      <h4 className="text-sm font-semibold mb-2">Description</h4>
                                      <p className="text-sm text-muted-foreground">{device.description}</p>
                                    </div>
                                  </>
                                )}

                                {/* Device-specific information display */}
                                {(device.ports || device.poeSupport || device.wifiStandard || device.throughput) && (
                                  <>
                                    <div className="col-span-full pt-2 pb-2">
                                      <Separator />
                                    </div>
                                    <div className="col-span-full mb-2">
                                      <h4 className="text-sm font-semibold">Technical Specifications</h4>
                                    </div>
                                    
                                    {device.ports && (
                                      <div className="flex items-center gap-2 text-foreground/80">
                                        <Network className="h-4 w-4 text-muted-foreground" />
                                        <span><b>Ports:</b> {device.ports}</span>
                                      </div>
                                    )}
                                    {device.poeSupport && device.poeSupport !== "none" && (
                                      <div className="flex items-center gap-2 text-foreground/80">
                                        <Zap className="h-4 w-4 text-muted-foreground" />
                                        <span><b>PoE:</b> {device.poeSupport}</span>
                                      </div>
                                    )}
                                    {device.wifiStandard && (
                                      <div className="flex items-center gap-2 text-foreground/80">
                                        <Wifi className="h-4 w-4 text-muted-foreground" />
                                        <span><b>WiFi:</b> {device.wifiStandard}</span>
                                      </div>
                                    )}
                                    {device.throughput && (
                                      <div className="flex items-center gap-2 text-foreground/80">
                                        <Shield className="h-4 w-4 text-muted-foreground" />
                                        <span><b>Throughput:</b> {device.throughput}</span>
                                      </div>
                                    )}
                                    {device.bandwidth && (
                                      <div className="flex items-center gap-2 text-foreground/80">
                                        <Router className="h-4 w-4 text-muted-foreground" />
                                        <span><b>Bandwidth:</b> {device.bandwidth}</span>
                                      </div>
                                    )}
                                  </>
                                )}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <div className="px-6">
                        <div className="flex gap-2 mt-2 mb-2">
                          <Button variant="outline" className="flex-1">
                            <History className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                          <Button 
                                  variant="outline" 
                                  size="icon" 
                            onClick={() => {
                                    openEditDialog(device);
                                    
                                    const dialogTriggerButton = document.getElementById(`edit-dialog-trigger-${device.id}`);
                                    if (dialogTriggerButton) {
                                      dialogTriggerButton.click();
                                    }
                                  }}
                                >
                                  <Pencil className="h-4 w-4" />
                          </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Device</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="icon">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Network Device</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Are you sure you want to delete &quot;{device.name}&quot;? This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => deleteDevice(device.id)}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TooltipTrigger>
                              <TooltipContent>Delete Device</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                                </div>
                                </div>

                      {/* Hidden edit dialog triggers */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button id={`edit-dialog-trigger-${device.id}`} className="hidden" />
                        </AlertDialogTrigger>
                        <AlertDialogContent className="max-w-[95vw] w-[600px] max-h-[90vh] overflow-y-auto">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Edit {device.name}</AlertDialogTitle>
                            <AlertDialogDescription>
                              <div className="space-y-4 pt-4">
                                <div className="grid w-full items-center gap-1.5">
                                  <Label htmlFor="editName">Device Name</Label>
                                  <Input
                                    id="editName"
                                    type="text"
                                    placeholder="e.g. Main Switch"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                  />
                              </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="editBrand">Brand</Label>
                                    <Input
                                      id="editBrand"
                                      type="text"
                                      placeholder="e.g. Cisco"
                                      value={editBrand}
                                      onChange={(e) => setEditBrand(e.target.value)}
                                    />
                              </div>
                                  <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="editModel">Model</Label>
                                    <Input
                                      id="editModel"
                                      type="text"
                                      placeholder="e.g. SG350-28"
                                      value={editModel}
                                      onChange={(e) => setEditModel(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="editIp">IP Address</Label>
                                    <Input
                                      id="editIp"
                                      type="text"
                                      placeholder="e.g. 192.168.1.10"
                                      value={editIp}
                                      onChange={(e) => setEditIp(e.target.value)}
                                    />
                                  </div>
                                  <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="editLocation">Location</Label>
                                    <Input
                                      id="editLocation"
                                      type="text"
                                      placeholder="e.g. Server Room"
                                      value={editLocation}
                                      onChange={(e) => setEditLocation(e.target.value)}
                                    />
                                  </div>
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                  <Label htmlFor="editDescription">Description</Label>
                                  <Textarea
                                    id="editDescription"
                                    placeholder="Device description..."
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Switch
                                    id="editMonitoringCheckbox"
                                    checked={editMonitoring}
                                    onCheckedChange={setEditMonitoring}
                                  />
                                  <Label htmlFor="editMonitoringCheckbox">Enable Monitoring</Label>
                                </div>
                              </div>
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel onClick={() => setEditId(null)}>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={edit}>Save Changes</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                          </Card>
                  )
                })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg">Loading network devices...</div>
                      </div>
                    )}

          {/* Pagination */}
          {!loading && devices.length > 0 && !searchTerm && (
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="flex-1 text-sm text-muted-foreground">
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)} to{" "}
                {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} devices
              </div>
              <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentPage === 1}
                        >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                        </Button>
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, maxPage) }, (_, i) => {
                    const pageNumber = i + 1;
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNumber)}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  {maxPage > 5 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant={currentPage === maxPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(maxPage)}
                      >
                        {maxPage}
                      </Button>
                    </>
                                )}
                              </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNext}
                  disabled={currentPage === maxPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
                            </div>
                    </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
} 