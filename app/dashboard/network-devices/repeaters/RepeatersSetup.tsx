"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import axios from "axios";

interface Repeater {
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

export default function RepeatersSetup() {
  const [repeaters, setRepeaters] = useState<Repeater[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRepeaters = async () => {
    try {
      const response = await axios.post("/api/network-devices/get", {
        type: "repeater"
      });
      
      if ((response.data as any).success) {
        setRepeaters((response.data as any).devices);
      }
    } catch (error) {
      console.error("Error fetching repeaters:", error);
      toast.error("Failed to load repeaters");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRepeaters();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading repeaters...</div>
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
              📡 Repeaters Setup
            </h1>
            <p className="text-muted-foreground mt-2">
              Configure and manage your network repeaters and signal extenders
            </p>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              🚧 Coming Soon
            </CardTitle>
            <CardDescription className="text-orange-700">
              Repeater configuration is currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-orange-600 mb-4">
              The repeater setup functionality will include:
            </p>
            <ul className="list-disc list-inside text-sm text-orange-600 space-y-1">
              <li>Signal strength monitoring</li>
              <li>Coverage area configuration</li>
              <li>Parent device association</li>
              <li>Frequency band management</li>
              <li>Power level optimization</li>
            </ul>
          </CardContent>
        </Card>

        {/* Current Repeaters */}
        <div className="grid gap-4">
          <h2 className="text-xl font-semibold">Configured Repeaters ({repeaters.length})</h2>
          
          {repeaters.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-muted-foreground">
                  No repeaters configured yet. Full setup functionality coming soon.
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {repeaters.map((repeater) => (
                <Card key={repeater.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{repeater.name}</h3>
                          <Badge variant={repeater.online ? "default" : "destructive"}>
                            {repeater.online ? "Online" : "Offline"}
                          </Badge>
                          {repeater.monitoring && (
                            <Badge variant="outline">Monitored</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          {repeater.brand && (
                            <div>
                              <span className="text-muted-foreground">Brand:</span> {repeater.brand}
                            </div>
                          )}
                          {repeater.model && (
                            <div>
                              <span className="text-muted-foreground">Model:</span> {repeater.model}
                            </div>
                          )}
                          {repeater.ip && (
                            <div>
                              <span className="text-muted-foreground">IP:</span> {repeater.ip}
                            </div>
                          )}
                        </div>
                        
                        {repeater.location && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Location:</span> {repeater.location}
                          </div>
                        )}
                        
                        {repeater.description && (
                          <div className="text-sm text-muted-foreground">
                            {repeater.description}
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