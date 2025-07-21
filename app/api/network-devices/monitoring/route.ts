import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface NetworkDeviceMonitoring {
  id: number;
  online: boolean;
  uptime: string;
  responseTime: number; // in milliseconds
  lastChecked: string;
  packetLoss?: number; // percentage
  bandwidth?: string; // current bandwidth usage
}

export async function GET(request: NextRequest) {
  try {
    const devices = await (prisma as any).network_device.findMany({
      select: {
        id: true,
        online: true,
        uptime: true,
        responseTime: true,
        lastChecked: true,
        packetLoss: true,
        bandwidth: true,
        createdAt: true
      }
    });

    // Get the last online timestamp for each device from history
    const deviceHistory = await (prisma as any).network_device_history.findMany({
      where: {
        deviceId: { in: devices.map((d: any) => d.id) },
        online: true
      },
      orderBy: { createdAt: 'desc' },
      distinct: ['deviceId'],
      select: {
        deviceId: true,
        createdAt: true
      }
    });

    const monitoringData: NetworkDeviceMonitoring[] = devices.map((device: {
      id: number;
      online: boolean;
      uptime: string | null;
      responseTime: string | null;
      lastChecked: Date | null;
      packetLoss: string | null;
      bandwidth: string | null;
      createdAt: Date;
    }) => {
      let calculatedUptime = "Unknown";
      
      if (device.online) {
        // Find the most recent online history entry for this device
        const lastOnlineHistory = deviceHistory.find((h: any) => h.deviceId === device.id);
        
        if (lastOnlineHistory) {
          const onlineTime = new Date(lastOnlineHistory.createdAt);
          const now = new Date();
          const uptimeMs = now.getTime() - onlineTime.getTime();
          
          // Convert to human readable format
          const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));
          
          if (days > 0) {
            calculatedUptime = `${days}d ${hours}h ${minutes}m`;
          } else if (hours > 0) {
            calculatedUptime = `${hours}h ${minutes}m`;
          } else if (minutes > 0) {
            calculatedUptime = `${minutes}m`;
          } else {
            calculatedUptime = "< 1m";
          }
        } else {
          // Fallback to device creation time if no history
          const createdTime = new Date(device.createdAt);
          const now = new Date();
          const uptimeMs = now.getTime() - createdTime.getTime();
          
          const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          
          if (days > 0) {
            calculatedUptime = `${days}d ${hours}h`;
          } else if (hours > 0) {
            calculatedUptime = `${hours}h`;
          } else {
            calculatedUptime = "< 1h";
          }
        }
      }

      return {
        id: device.id,
        online: device.online,
        uptime: calculatedUptime,
        responseTime: device.responseTime ? parseFloat(device.responseTime) : 0,
        lastChecked: device.lastChecked ? device.lastChecked.toISOString() : new Date().toISOString(),
        packetLoss: device.packetLoss ? parseFloat(device.packetLoss) : 0,
        bandwidth: device.bandwidth || "0 Mbps"
      };
    });

    return NextResponse.json(monitoringData, { status: 200 });
  } catch (error: any) {
    console.error('Network device monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network device monitoring data' },
      { status: 500 }
    );
  }
} 