"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

interface OtherDevice {
  id: number;
  name: string;
  brand?: string;
  model?: string;
  ip?: string;
  location?: string;
  description?: string;
  monitoring: boolean;
  online: boolean;
  createdAt: string;
}

export default function OtherDevicesSetup() {
  const [otherDevices, setOtherDevices] = useState<OtherDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOtherDevices = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {
        type: "other"
      });
      
      if ((response.data as any).success) {
        setOtherDevices((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching other devices:", error);
      toast.error("Failed to load other devices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOtherDevices();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading other devices...</div>
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
              🔧 Other Network Devices Setup
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage specialized network devices and equipment
            </p>
          </div>
        </div>

        {/* Device Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📋 Device Categories
            </CardTitle>
            <CardDescription>
              This section handles miscellaneous network devices not covered by other categories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">🔌 Network Attached Storage (NAS)</h3>
                <p className="text-xs text-muted-foreground">Storage devices connected to your network</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">📹 IP Cameras</h3>
                <p className="text-xs text-muted-foreground">Security cameras and surveillance equipment</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">🖨️ Network Printers</h3>
                <p className="text-xs text-muted-foreground">Shared printers and print servers</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">🔊 VoIP Phones</h3>
                <p className="text-xs text-muted-foreground">Voice over IP phones and systems</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">⚡ UPS Devices</h3>
                <p className="text-xs text-muted-foreground">Uninterruptible power supplies</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-sm mb-2">🌡️ IoT Sensors</h3>
                <p className="text-xs text-muted-foreground">Temperature, humidity, and other sensors</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coming Soon Notice */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              🚧 Coming Soon
            </CardTitle>
            <CardDescription className="text-blue-700">
              Other device configuration is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-600 mb-4">
              The other devices setup functionality will include:
            </p>
            <ul className="list-disc list-inside text-sm text-blue-600 space-y-1">
              <li>Custom device type definitions</li>
              <li>Flexible configuration options</li>
              <li>Protocol-specific monitoring</li>
              <li>Custom health checks</li>
              <li>Integration with specialized software</li>
            </ul>
          </CardContent>
        </Card>

        {/* Current Other Devices */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Configured Other Devices ({otherDevices.length})</h2>
          
          {otherDevices.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No other devices configured yet. Full setup functionality coming soon.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {otherDevices.map((device) => (
                <Card key={device.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{device.name}</h3>
                          <Badge variant={device.online ? "default" : "destructive"}>
                            {device.online ? "Online" : "Offline"}
                          </Badge>
                          {device.monitoring && (
                            <Badge variant="outline">Monitored</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {device.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span> {device.brand}
                            </div>
                          )}
                          {device.model && (
                            <div>
                              <span className="text-muted-foreground">Model:</span> {device.model}
                            </div>
                          )}
                          {device.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {device.ip}
                            </div>
                          )}
                        </div>
                        
                        {device.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span> {device.location}
                          </div>
                        )}
                        
                        {device.description && (
                          <div className="text-sm text-muted-foreground">
                            {device.description}
                          </div>
                        )}
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