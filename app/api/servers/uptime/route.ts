import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface RequestBody {
    timespan?: number;
    page?: number;
    itemsPerPage?: number;
  }

interface ServerData {
  id: number;
  name: string;
  host: boolean;
  os: string | null;
  online: boolean;
  uptime: string | null;
  monitoring: boolean;
  monitoringURL: string | null;
}

interface HistoryCheck {
  serverId: number;
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

// Helper function to generate Glances-based uptime summary for physical servers
const generateGlancesUptimeSummary = (server: ServerData, intervals: Date[], timespan: number) => {
  // For physical servers with Glances, we assume they're online if they have recent uptime data
  // The uptime from Glances indicates the server is currently running
  const isOnline = server.online && server.uptime && server.uptime !== "";
  
  return intervals.map(interval => {
    const intervalKey = getIntervalKey(interval, timespan);
    
    // For Glances monitoring, if the server is currently online, we assume it was online
    // during recent intervals (this is a reasonable assumption for uptime display)
    // In a real implementation, you might want to store more granular Glances history
    return {
      timestamp: intervalKey,
      missing: false,
      online: isOnline
    };
  });
};

export async function POST(request: NextRequest) {
    try {
      const { timespan = 1, page = 1, itemsPerPage = 5 }: RequestBody = await request.json();
      const skip = (page - 1) * itemsPerPage;
  
      // Get paginated and sorted servers with additional fields
      const [servers, totalCount] = await Promise.all([
        prisma.server.findMany({
          skip,
          take: itemsPerPage,
          orderBy: { name: 'asc' },
          select: {
            id: true,
            name: true,
            host: true,
            os: true,
            online: true,
            uptime: true,
            monitoring: true,
            monitoringURL: true,
          },
        }),
        prisma.server.count()
      ]);
  
      const serverIds = servers.map((server: ServerData) => server.id);
      
      // Get time range and intervals
      const { start } = getTimeRange(timespan);
      const intervals = generateIntervals(timespan);
  
      // Only get uptime history for VMs (non-physical servers)
      const vmServers = servers.filter((server: ServerData) => !server.host);
      const vmServerIds = vmServers.map((server: ServerData) => server.id);
      
      const uptimeHistory = vmServerIds.length > 0 ? await prisma.server_history.findMany({
        where: {
          serverId: { in: vmServerIds },
          createdAt: { gte: start }
        },
        orderBy: { createdAt: "desc" }
      }) : [];
  
      // Process data for each server
      const result = servers.map((server: ServerData) => {
        const serverType = server.host ? 'Physical Host' : (server.os?.includes('VM') || server.os?.includes('Virtual') ? 'Virtual Machine' : 'Server');
        
        let uptimeSummary;
        
        if (server.host) {
          // Physical servers: Use Glances uptime (assume online if monitoring and has uptime)
          uptimeSummary = generateGlancesUptimeSummary(server, intervals, timespan);
        } else {
          // VMs: Use history-based calculation (your own service uptime)
          const serverChecks = uptimeHistory.filter((check: HistoryCheck) => check.serverId === server.id);
          const checksMap = new Map<string, { failed: number; total: number }>();
    
          for (const check of serverChecks) {
            const intervalKey = getIntervalKey(check.createdAt, timespan);
            const current = checksMap.get(intervalKey) || { failed: 0, total: 0 };
            current.total++;
            if (!check.online) current.failed++;
            checksMap.set(intervalKey, current);
          }
    
          uptimeSummary = intervals.map(interval => {
            const intervalKey = getIntervalKey(interval, timespan);
            const stats = checksMap.get(intervalKey);
            
            return {
              timestamp: intervalKey,
              missing: !stats,
              online: stats ? (stats.failed / stats.total) <= 0.5 : null
            };
          });
        }
  
        return {
          serverName: server.name,
          serverId: server.id,
          serverType,
          uptimeSummary,
          monitoringType: server.host ? 'glances' : 'service'
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  } 