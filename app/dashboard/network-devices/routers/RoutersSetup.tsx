"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

interface Router {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  ip?: string;
  macAddress?: string;
  location?: string;
  description?: string;
  managementURL?: string;
  monitoring: boolean;
  online: boolean;
  firmwareVersion?: string;
  powerConsumption?: number;
  portsCount?: number;
  createdAt: string;
}

const routerBrands = [
  "Cisco", "Netgear", "TP-Link", "Asus", "Linksys", "D-Link", 
  "Mikrotik", "Ubiquiti", "Juniper", "Huawei", "Pfsense", "Other"
];

export default function RoutersSetup() {
  const [routers, setRouters] = useState<Router[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRouter, setEditingRouter] = useState<Router | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    ip: "",
    macAddress: "",
    location: "",
    description: "",
    managementURL: "",
    monitoring: true,
    firmwareVersion: "",
    powerConsumption: 15,
    portsCount: 4
  });

  const fetchRouters = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {
        type: "router"
      });
      
      if ((response.data as any).success) {
        setRouters((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching routers:", error);
      toast.error("Failed to load routers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRouters();
  }, []);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      brand: "",
      model: "",
      ip: "",
      macAddress: "",
      location: "",
      description: "",
      managementURL: "",
      monitoring: true,
      firmwareVersion: "",
      powerConsumption: 15,
      portsCount: 4
    });
    setEditingRouter(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Router name is required");
      return;
    }

    try {
      const routerData = {
        ...formData,
        type: "router",
        icon: "router"
      };

      if (editingRouter) {
        await axios.post("/api/network-devices/edit", {
          id: editingRouter.id,
          ...routerData
        });
        toast.success("Router updated successfully");
      } else {
        await axios.post("/api/network-devices/add", routerData);
        toast.success("Router added successfully");
      }

      resetForm();
      fetchRouters();
    } catch (error) {
      console.error("Error saving router:", error);
      toast.error(editingRouter ? "Failed to update router" : "Failed to add router");
    }
  };

  const handleEdit = (router: Router) => {
    setFormData({
      name: router.name,
      brand: router.brand || "",
      model: router.model || "",
      ip: router.ip || "",
      macAddress: router.macAddress || "",
      location: router.location || "",
      description: router.description || "",
      managementURL: router.managementURL || "",
      monitoring: router.monitoring,
      firmwareVersion: router.firmwareVersion || "",
      powerConsumption: router.powerConsumption || 15,
      portsCount: router.portsCount || 4
    });
    setEditingRouter(router);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this router?")) return;

    try {
      await axios.post("/api/network-devices/delete", { id });
      toast.success("Router deleted successfully");
      fetchRouters();
    } catch (error) {
      console.error("Error deleting router:", error);
      toast.error("Failed to delete router");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading routers...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              🌐 Routers Setup
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage your network routers
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Router
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingRouter ? "Edit Router" : "Add New Router"}
              </CardTitle>
              <CardDescription>
                Configure router settings and monitoring options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="network">Network Configuration</TabsTrigger>
                  <TabsTrigger value="hardware">Hardware Details</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Router Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Main Gateway Router"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="e.g., Network Closet"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe the router purpose and network segments"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="network" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ip">IP Address</Label>
                      <Input
                        id="ip"
                        value={formData.ip}
                        onChange={(e) => handleInputChange("ip", e.target.value)}
                        placeholder="192.168.1.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="macAddress">MAC Address</Label>
                      <Input
                        id="macAddress"
                        value={formData.macAddress}
                        onChange={(e) => handleInputChange("macAddress", e.target.value)}
                        placeholder="AA:BB:CC:DD:EE:FF"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="managementURL">Management URL</Label>
                    <Input
                      id="managementURL"
                      value={formData.managementURL}
                      onChange={(e) => handleInputChange("managementURL", e.target.value)}
                      placeholder="https://192.168.1.1"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="hardware" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="brand">Brand</Label>
                      <Select
                        value={formData.brand}
                        onValueChange={(value) => handleInputChange("brand", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select brand" />
                        </SelectTrigger>
                        <SelectContent>
                          {routerBrands.map((brand) => (
                            <SelectItem key={brand} value={brand}>
                              {brand}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        value={formData.model}
                        onChange={(e) => handleInputChange("model", e.target.value)}
                        placeholder="e.g., RV340"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="portsCount">Ethernet Ports</Label>
                      <Input
                        id="portsCount"
                        type="number"
                        value={formData.portsCount}
                        onChange={(e) => handleInputChange("portsCount", parseInt(e.target.value) || 0)}
                        placeholder="4"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firmwareVersion">Firmware Version</Label>
                      <Input
                        id="firmwareVersion"
                        value={formData.firmwareVersion}
                        onChange={(e) => handleInputChange("firmwareVersion", e.target.value)}
                        placeholder="e.g., 1.0.03.24"
                      />
                    </div>
                    <div>
                      <Label htmlFor="powerConsumption">Power Consumption (W)</Label>
                      <Input
                        id="powerConsumption"
                        type="number"
                        value={formData.powerConsumption}
                        onChange={(e) => handleInputChange("powerConsumption", parseInt(e.target.value) || 0)}
                        placeholder="15"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="monitoring" className="space-y-4 mt-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="monitoring"
                      checked={formData.monitoring}
                      onCheckedChange={(checked) => handleInputChange("monitoring", checked)}
                    />
                    <Label htmlFor="monitoring">Enable Monitoring</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    When enabled, this router will be monitored for connectivity and performance
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleSubmit}>
                  {editingRouter ? "Update Router" : "Add Router"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Routers List */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Configured Routers ({routers.length})</h2>
          
          {routers.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No routers configured yet. Add your first router to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {routers.map((router) => (
                <Card key={router.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{router.name}</h3>
                          <Badge variant={router.online ? "default" : "destructive"}>
                            {router.online ? "Online" : "Offline"}
                          </Badge>
                          {router.monitoring && (
                            <Badge variant="outline">Monitored</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {router.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span> {router.brand}
                            </div>
                          )}
                          {router.model && (
                            <div>
                              <span className="text-muted-foreground">Model:</span> {router.model}
                            </div>
                          )}
                          {router.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {router.ip}
                            </div>
                          )}
                          {router.portsCount && (
                            <div>
                              <span className="text-muted-foreground">Ports:</span> {router.portsCount}
                            </div>
                          )}
                        </div>
                        
                        {router.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span> {router.location}
                          </div>
                        )}
                        
                        {router.description && (
                          <div className="text-sm text-muted-foreground">
                            {router.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(router)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(router.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
} 