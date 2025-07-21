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

interface NetworkSwitch {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  ip?: string;
  macAddress?: string;
  location?: string;
  description?: string;
  portsCount?: number;
  managementURL?: string;
  monitoring: boolean;
  online: boolean;
  firmwareVersion?: string;
  powerConsumption?: number;
  createdAt: string;
}

const switchBrands = [
  "Cisco", "HP/Aruba", "Netgear", "D-Link", "TP-Link", "Ubiquiti", 
  "Juniper", "Dell", "Extreme Networks", "Huawei", "Other"
];

const portCounts = [4, 8, 16, 24, 48, 52];

export default function SwitchesSetup() {
  const [switches, setSwitches] = useState<NetworkSwitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSwitch, setEditingSwitch] = useState<NetworkSwitch | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    model: "",
    ip: "",
    macAddress: "",
    location: "",
    description: "",
    portsCount: 24,
    managementURL: "",
    monitoring: true,
    firmwareVersion: "",
    powerConsumption: 0
  });

  const fetchSwitches = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {
        type: "switch"
      });
      
      if ((response.data as any).success) {
        setSwitches((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching switches:", error);
      toast.error("Failed to load switches");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSwitches();
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
      portsCount: 24,
      managementURL: "",
      monitoring: true,
      firmwareVersion: "",
      powerConsumption: 0
    });
    setEditingSwitch(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Switch name is required");
      return;
    }

    try {
      const switchData = {
        ...formData,
        type: "switch",
        icon: "switch"
      };

      if (editingSwitch) {
        // Update existing switch
        await axios.post("/api/network-devices/edit", {
          id: editingSwitch.id,
          ...switchData
        });
        toast.success("Switch updated successfully");
      } else {
        // Add new switch
        await axios.post("/api/network-devices/add", switchData);
        toast.success("Switch added successfully");
      }

      resetForm();
      fetchSwitches();
    } catch (error) {
      console.error("Error saving switch:", error);
      toast.error(editingSwitch ? "Failed to update switch" : "Failed to add switch");
    }
  };

  const handleEdit = (switchDevice: NetworkSwitch) => {
    setFormData({
      name: switchDevice.name,
      brand: switchDevice.brand || "",
      model: switchDevice.model || "",
      ip: switchDevice.ip || "",
      macAddress: switchDevice.macAddress || "",
      location: switchDevice.location || "",
      description: switchDevice.description || "",
      portsCount: switchDevice.portsCount || 24,
      managementURL: switchDevice.managementURL || "",
      monitoring: switchDevice.monitoring,
      firmwareVersion: switchDevice.firmwareVersion || "",
      powerConsumption: switchDevice.powerConsumption || 0
    });
    setEditingSwitch(switchDevice);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this switch?")) return;

    try {
      await axios.post("/api/network-devices/delete", { id });
      toast.success("Switch deleted successfully");
      fetchSwitches();
    } catch (error) {
      console.error("Error deleting switch:", error);
      toast.error("Failed to delete switch");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading switches...</div>
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
              🔀 Network Switches Setup
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage your network switches
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Switch
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingSwitch ? "Edit Switch" : "Add New Switch"}
              </CardTitle>
              <CardDescription>
                Configure switch settings and monitoring options
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
                      <Label htmlFor="name">Switch Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Main Office Switch"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="e.g., Server Room Rack 1"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe the switch purpose and configuration"
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
                        placeholder="192.168.1.100"
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
                      placeholder="https://192.168.1.100"
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
                          {switchBrands.map((brand) => (
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
                        placeholder="e.g., SG350-28"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="portsCount">Number of Ports</Label>
                      <Select
                        value={formData.portsCount.toString()}
                        onValueChange={(value) => handleInputChange("portsCount", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {portCounts.map((count) => (
                            <SelectItem key={count} value={count.toString()}>
                              {count} ports
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="firmwareVersion">Firmware Version</Label>
                      <Input
                        id="firmwareVersion"
                        value={formData.firmwareVersion}
                        onChange={(e) => handleInputChange("firmwareVersion", e.target.value)}
                        placeholder="e.g., 2.5.7.85"
                      />
                    </div>
                    <div>
                      <Label htmlFor="powerConsumption">Power Consumption (W)</Label>
                      <Input
                        id="powerConsumption"
                        type="number"
                        value={formData.powerConsumption}
                        onChange={(e) => handleInputChange("powerConsumption", parseInt(e.target.value) || 0)}
                        placeholder="25"
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
                    When enabled, this switch will be monitored for connectivity and performance
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleSubmit}>
                  {editingSwitch ? "Update Switch" : "Add Switch"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Switches List */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Configured Switches ({switches.length})</h2>
          
          {switches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No switches configured yet. Add your first switch to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {switches.map((switchDevice) => (
                <Card key={switchDevice.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{switchDevice.name}</h3>
                          <Badge variant={switchDevice.online ? "default" : "destructive"}>
                            {switchDevice.online ? "Online" : "Offline"}
                          </Badge>
                          {switchDevice.monitoring && (
                            <Badge variant="outline">Monitored</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {switchDevice.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span> {switchDevice.brand}
                            </div>
                          )}
                          {switchDevice.model && (
                            <div>
                              <span className="text-muted-foreground">Model:</span> {switchDevice.model}
                            </div>
                          )}
                          {switchDevice.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {switchDevice.ip}
                            </div>
                          )}
                          {switchDevice.portsCount && (
                            <div>
                              <span className="text-muted-foreground">Ports:</span> {switchDevice.portsCount}
                            </div>
                          )}
                        </div>
                        
                        {switchDevice.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span> {switchDevice.location}
                          </div>
                        )}
                        
                        {switchDevice.description && (
                          <div className="text-sm text-muted-foreground">
                            {switchDevice.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(switchDevice)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(switchDevice.id)}
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