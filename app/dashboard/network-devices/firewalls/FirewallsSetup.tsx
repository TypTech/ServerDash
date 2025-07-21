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

interface Firewall {
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

const firewallBrands = [
  "SonicWall", "Fortinet", "Palo Alto", "Cisco", "pfSense", "OPNsense", 
  "WatchGuard", "Barracuda", "Check Point", "Sophos", "Juniper", "Other"
];

export default function FirewallsSetup() {
  const [firewalls, setFirewalls] = useState<Firewall[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFirewall, setEditingFirewall] = useState<Firewall | null>(null);
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
    powerConsumption: 12,
    portsCount: 6
  });

  const fetchFirewalls = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {
        type: "firewall"
      });
      
      if ((response.data as any).success) {
        setFirewalls((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching firewalls:", error);
      toast.error("Failed to load firewalls");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirewalls();
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
      powerConsumption: 12,
      portsCount: 6
    });
    setEditingFirewall(null);
    setShowAddForm(false);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error("Firewall name is required");
      return;
    }

    try {
      const firewallData = {
        ...formData,
        type: "firewall",
        icon: "shield"
      };

      if (editingFirewall) {
        await axios.post("/api/network-devices/edit", {
          id: editingFirewall.id,
          ...firewallData
        });
        toast.success("Firewall updated successfully");
      } else {
        await axios.post("/api/network-devices/add", firewallData);
        toast.success("Firewall added successfully");
      }

      resetForm();
      fetchFirewalls();
    } catch (error) {
      console.error("Error saving firewall:", error);
      toast.error(editingFirewall ? "Failed to update firewall" : "Failed to add firewall");
    }
  };

  const handleEdit = (firewall: Firewall) => {
    setFormData({
      name: firewall.name,
      brand: firewall.brand || "",
      model: firewall.model || "",
      ip: firewall.ip || "",
      macAddress: firewall.macAddress || "",
      location: firewall.location || "",
      description: firewall.description || "",
      managementURL: firewall.managementURL || "",
      monitoring: firewall.monitoring,
      firmwareVersion: firewall.firmwareVersion || "",
      powerConsumption: firewall.powerConsumption || 12,
      portsCount: firewall.portsCount || 6
    });
    setEditingFirewall(firewall);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this firewall?")) return;

    try {
      await axios.post("/api/network-devices/delete", { id });
      toast.success("Firewall deleted successfully");
      fetchFirewalls();
    } catch (error) {
      console.error("Error deleting firewall:", error);
      toast.error("Failed to delete firewall");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading firewalls...</div>
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
              🛡️ Firewalls Setup
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage your network security firewalls
            </p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="bg-red-600 hover:bg-red-700"
          >
            Add New Firewall
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showAddForm && (
          <Card>
            <CardHeader>
              <CardTitle>
                {editingFirewall ? "Edit Firewall" : "Add New Firewall"}
              </CardTitle>
              <CardDescription>
                Configure firewall settings and monitoring options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="basic" className="w-full">
                <TabsList>
                  <TabsTrigger value="basic">Basic Settings</TabsTrigger>
                  <TabsTrigger value="network">Network Configuration</TabsTrigger>
                  <TabsTrigger value="security">Security Features</TabsTrigger>
                  <TabsTrigger value="hardware">Hardware Details</TabsTrigger>
                  <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Firewall Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        placeholder="e.g., Security Firewall"
                      />
                    </div>
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        placeholder="e.g., Network Perimeter"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      placeholder="Describe the firewall purpose and security policies"
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="network" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ip">Management IP Address</Label>
                      <Input
                        id="ip"
                        value={formData.ip}
                        onChange={(e) => handleInputChange("ip", e.target.value)}
                        placeholder="192.168.1.254"
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
                      placeholder="https://192.168.1.254"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="security" className="space-y-4 mt-4">
                  <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-orange-800 mb-2">🔒 Security Features</h3>
                    <p className="text-sm text-orange-700">
                      This firewall provides network security through:
                    </p>
                    <ul className="list-disc list-inside text-sm text-orange-700 mt-2 space-y-1">
                      <li>Intrusion Prevention System (IPS)</li>
                      <li>Deep Packet Inspection (DPI)</li>
                      <li>Application Control</li>
                      <li>Web Filtering</li>
                      <li>VPN Gateway</li>
                      <li>Network Access Control</li>
                    </ul>
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
                          {firewallBrands.map((brand) => (
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
                        placeholder="e.g., TZ370"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="portsCount">Network Ports</Label>
                      <Input
                        id="portsCount"
                        type="number"
                        value={formData.portsCount}
                        onChange={(e) => handleInputChange("portsCount", parseInt(e.target.value) || 0)}
                        placeholder="6"
                      />
                    </div>
                    <div>
                      <Label htmlFor="firmwareVersion">Firmware Version</Label>
                      <Input
                        id="firmwareVersion"
                        value={formData.firmwareVersion}
                        onChange={(e) => handleInputChange("firmwareVersion", e.target.value)}
                        placeholder="e.g., 7.0.1-5112"
                      />
                    </div>
                    <div>
                      <Label htmlFor="powerConsumption">Power Consumption (W)</Label>
                      <Input
                        id="powerConsumption"
                        type="number"
                        value={formData.powerConsumption}
                        onChange={(e) => handleInputChange("powerConsumption", parseInt(e.target.value) || 0)}
                        placeholder="12"
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
                    When enabled, this firewall will be monitored for connectivity, security status, and performance
                  </p>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 mt-6">
                <Button onClick={handleSubmit}>
                  {editingFirewall ? "Update Firewall" : "Add Firewall"}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Firewalls List */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Configured Firewalls ({firewalls.length})</h2>
          
          {firewalls.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No firewalls configured yet. Add your first firewall to get started.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {firewalls.map((firewall) => (
                <Card key={firewall.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{firewall.name}</h3>
                          <Badge variant={firewall.online ? "default" : "destructive"}>
                            {firewall.online ? "Online" : "Offline"}
                          </Badge>
                          {firewall.monitoring && (
                            <Badge variant="outline">Monitored</Badge>
                          )}
                          <Badge variant="secondary" className="bg-red-100 text-red-800">
                            Security
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {firewall.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span> {firewall.brand}
                            </div>
                          )}
                          {firewall.model && (
                            <div>
                              <span className="text-muted-foreground">Model:</span> {firewall.model}
                            </div>
                          )}
                          {firewall.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {firewall.ip}
                            </div>
                          )}
                          {firewall.portsCount && (
                            <div>
                              <span className="text-muted-foreground">Ports:</span> {firewall.portsCount}
                            </div>
                          )}
                        </div>
                        
                        {firewall.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span> {firewall.location}
                          </div>
                        )}
                        
                        {firewall.description && (
                          <div className="text-sm text-muted-foreground">
                            {firewall.description}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(firewall)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(firewall.id)}
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