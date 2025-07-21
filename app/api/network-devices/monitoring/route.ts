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
        bandwidth: true
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
    }) => ({
      id: device.id,
      online: device.online,
      uptime: device.uptime || "Unknown",
      responseTime: device.responseTime ? parseFloat(device.responseTime) : 0,
      lastChecked: device.lastChecked ? device.lastChecked.toISOString() : new Date().toISOString(),
      packetLoss: device.packetLoss ? parseFloat(device.packetLoss) : 0,
      bandwidth: device.bandwidth || "0 Mbps"
    }));

    return NextResponse.json(monitoringData, { status: 200 });
  } catch (error: any) {
    console.error('Network device monitoring error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch network device monitoring data' },
      { status: 500 }
    );
  }
} 