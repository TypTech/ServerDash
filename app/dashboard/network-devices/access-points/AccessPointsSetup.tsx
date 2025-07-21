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

interface AccessPoint {
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
  wirelessStandard?: string;
  frequency?: string;
  createdAt: string;
}

const apBrands = [
  "Ubiquiti", "Cisco/Meraki", "HP/Aruba", "Netgear", "TP-Link", "D-Link", 
  "Ruckus", "Asus", "Linksys", "Mikrotik", "Other"
];

const wirelessStandards = [
  "802.11a", "802.11b", "802.11g", "802.11n", "802.11ac", "802.11ax (Wi-Fi 6)", "802.11be (Wi-Fi 7)"
];

const frequencies = [
  "2.4GHz", "5GHz", "6GHz", "2.4GHz + 5GHz", "2.4GHz + 5GHz + 6GHz"
];

export default function AccessPointsSetup() {
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAP, setEditingAP] = useState<AccessPoint | null>(null);
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
    powerConsumption: 8,
    wirelessStandard: "802.11ac",
    frequency: "2.4GHz + 5GHz"
  });

  const fetchAccessPoints = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {
        type: "access-point"
      });
      
      if ((response.data as any).success) {
        setAccessPoints((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching access points:", error);
      toast.error("Failed to load access points");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessPoints();
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
      powerConsumption: 8,
      wirelessStandard: "802.11ac",
      frequency: "2.4GHz + 5GHz"
    });
    setEditingAP(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Access point name is required");
      return;
    }

    try {
      const apData = {
        ...formData,
        type: "access-point",
        icon: "wifi"
      };

      if (editingAP) {
        await axios.post("/api/network-devices/edit", {
          id: editingAP.id,
          ...apData
        });
        toast.success("Access point updated successfully");
      } else {
        await axios.post("/api/network-devices/add", apData);
        toast.success("Access point added successfully");
      }

      resetForm();
      fetchAccessPoints();
    } catch (error) {
      console.error("Error saving access point:", error);
      toast.error(editingAP ? "Failed to update access point" : "Failed to add access point");
    }
  };

  const handleEdit = (ap: AccessPoint) => {
    setFormData({
      name: ap.name,
      brand: ap.brand || "",
      model: ap.model || "",
      ip: ap.ip || "",
      macAddress: ap.macAddress || "",
      location: ap.location || "",
      description: ap.description || "",
      managementURL: ap.managementURL || "",
      monitoring: ap.monitoring,
      firmwareVersion: ap.firmwareVersion || "",
      powerConsumption: ap.powerConsumption || 8,
      wirelessStandard: ap.wirelessStandard || "802.11ac",
      frequency: ap.frequency || "2.4GHz + 5GHz"
    });
    setEditingAP(ap);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this access point?")) return;

    try {
      await axios.post("/api/network-devices/delete", { id });
      toast.success("Access point deleted successfully");
      fetchAccessPoints();
    } catch (error) {
      console.error("Error deleting access point:", error);
      toast.error("Failed to delete access point");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading access points...</div>
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
              📶 Access Points Setup
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage your wireless access points
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Add New Access Point
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingAP ? "Edit Access Point" : "Add New Access Point"}
              </CardTitle>
              <CardDescription>
                Configure wireless access point settings and monitoring options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="network">Network Configuration</TabsTrigger>
                  <TabsTrigger value="wireless">Wireless Settings</TabsTrigger>
                  <TabsTrigger value="hardware">Hardware Details</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Access Point Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Office WiFi AP"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="e.g., Conference Room Ceiling"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe the access point coverage area and purpose"
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
                        placeholder="192.168.1.20"
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
                      placeholder="https://192.168.1.20"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="wireless" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="wirelessStandard">Wireless Standard</Label>
                      <Select
                        value={formData.wirelessStandard}
                        onValueChange={(value) => handleInputChange("wirelessStandard", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {wirelessStandards.map((standard) => (
                            <SelectItem key={standard} value={standard}>
                              {standard}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="frequency">Frequency Bands</Label>
                      <Select
                        value={formData.frequency}
                        onValueChange={(value) => handleInputChange("frequency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq} value={freq}>
                              {freq}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
                          {apBrands.map((brand) => (
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
                        placeholder="e.g., UniFi AP AC Pro"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firmwareVersion">Firmware Version</Label>
                      <Input
                        id="firmwareVersion"
                        value={formData.firmwareVersion}
                        onChange={(e) => handleInputChange("firmwareVersion", e.target.value)}
                        placeholder="e.g., 6.2.41"
                      />
                    </div>
                    <div>
                      <Label htmlFor="powerConsumption">Power Consumption (W)</Label>
                      <Input
                        id="powerConsumption"
                        type="number"
                        value={formData.powerConsumption}
                        onChange={(e) => handleInputChange("powerConsumption", parseInt(e.target.value) || 0)}
                        placeholder="8"
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
                    When enabled, this access point will be monitored for connectivity and performance
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleSubmit}>
                  {editingAP ? "Update Access Point" : "Add Access Point"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Access Points List */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Configured Access Points ({accessPoints.length})</h2>
          
          {accessPoints.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No access points configured yet. Add your first access point to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {accessPoints.map((ap) => (
                <Card key={ap.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{ap.name}</h3>
                          <Badge variant={ap.online ? "default" : "destructive"}>
                            {ap.online ? "Online" : "Offline"}
                          </Badge>
                          {ap.monitoring && (
                            <Badge variant="outline">Monitored</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {ap.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span> {ap.brand}
                            </div>
                          )}
                          {ap.model && (
                            <div>
                              <span className="text-muted-foreground">Model:</span> {ap.model}
                            </div>
                          )}
                          {ap.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {ap.ip}
                            </div>
                          )}
                          {ap.wirelessStandard && (
                            <div>
                              <span className="text-muted-foreground">Standard:</span> {ap.wirelessStandard}
                            </div>
                          )}
                        </div>
                        
                        {ap.frequency && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Frequency:</span> {ap.frequency}
                          </div>
                        )}
                        
                        {ap.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span> {ap.location}
                          </div>
                        )}
                        
                        {ap.description && (
                          <div className="text-sm text-muted-foreground">
                            {ap.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(ap)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(ap.id)}
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