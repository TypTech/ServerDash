import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface NetworkDeviceUptimeData {
  deviceName: string;
  deviceId: number;
  deviceType: string;
  uptimeSummary: {
    timestamp: string;
    missing: boolean;
    online: boolean | null;
  }[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

interface HistoryEntry {
  online: boolean;
  createdAt: Date;
}

const getTimeRange = (timespan: number) => {
  const now = new Date();
  switch (timespan) {
    case 1:
      return { 
        start: new Date(now.getTime() - 60 * 60 * 1000),
        interval: 'minute' 
      };
    case 2:
      return { 
        start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        interval: 'hour' 
      };
    case 3:
      return { 
        start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        interval: 'day' 
      };
    case 4:
      return { 
        start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        interval: 'day' 
      };
    default:
      return { 
        start: new Date(now.getTime() - 60 * 60 * 1000),
        interval: 'minute' 
      };
  }
};

const generateIntervals = (timespan: number) => {
  const now = new Date();
  now.setSeconds(0, 0);
  
  switch (timespan) {
    case 1: // 1 hour - 60 one-minute intervals
      return Array.from({ length: 60 }, (_, i) => {
        const d = new Date(now);
        d.setMinutes(d.getMinutes() - i);
        d.setSeconds(0, 0);
        return d;
      });
      
    case 2: // 1 day - 24 one-hour intervals
      return Array.from({ length: 24 }, (_, i) => {
        const d = new Date(now);
        d.setHours(d.getHours() - i);
        d.setMinutes(0, 0, 0);
        return d;
      });

    case 3: // 7 days
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      });

    case 4: // 30 days
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      });

    default:
      return [];
  }
};

const getIntervalKey = (date: Date, timespan: number) => {
  const d = new Date(date);
  switch (timespan) {
    case 1: // 1 hour - minute intervals
      d.setSeconds(0, 0);
      return d.toISOString();
    case 2: // 1 day - hour intervals
      d.setMinutes(0, 0, 0);
      return d.toISOString();
    case 3: // 7 days - day intervals
    case 4: // 30 days - day intervals
      d.setHours(0, 0, 0, 0);
      return d.toISOString();
    default:
      return d.toISOString();
  }
};

export async function POST(request: NextRequest) {
  try {
    const { timespan = 1, page = 1, itemsPerPage = 5 } = await request.json();
    const skip = (page - 1) * itemsPerPage;

    // Get paginated and sorted network devices
    const [devices, totalCount] = await Promise.all([
      (prisma as any).network_device.findMany({
        skip,
        take: itemsPerPage,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          type: true,
        },
      }),
      (prisma as any).network_device.count()
    ]);

    const deviceIds = devices.map((device: any) => device.id);
    
    // Get time range and intervals
    const { start } = getTimeRange(timespan);
    const intervals = generateIntervals(timespan);

    // Get uptime history for the filtered devices
    const uptimeHistory = await (prisma as any).network_device_history.findMany({
      where: {
        deviceId: { in: deviceIds },
        createdAt: { gte: start }
      },
      orderBy: { createdAt: "desc" }
    });

    // Process data for each device
    const result = devices.map((device: any) => {
      const deviceChecks = uptimeHistory.filter((check: any) => check.deviceId === device.id);
      const checksMap = new Map<string, { failed: number; total: number }>();

      for (const check of deviceChecks) {
        const intervalKey = getIntervalKey(check.createdAt, timespan);
        const current = checksMap.get(intervalKey) || { failed: 0, total: 0 };
        current.total++;
        if (!check.online) current.failed++;
        checksMap.set(intervalKey, current);
      }

      const uptimeSummary = intervals.map(interval => {
        const intervalKey = getIntervalKey(interval, timespan);
        const stats = checksMap.get(intervalKey);
        
        return {
          timestamp: intervalKey,
          missing: !stats,
          online: stats ? (stats.failed / stats.total) <= 0.5 : null
        };
      });

      return {
        deviceName: device.name,
        deviceId: device.id,
        deviceType: device.type,
        uptimeSummary
      };
    });

    return NextResponse.json({
      data: result,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / itemsPerPage),
        totalItems: totalCount
      }
    });
  } catch (error) {
    console.error("Network device uptime error:", error);
    return NextResponse.json(
      { error: "Failed to fetch network device uptime data" },
      { status: 500 }
    );
  }
} 