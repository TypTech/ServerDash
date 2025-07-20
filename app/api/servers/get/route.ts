import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

interface GetRequest {
    page?: number;
    ITEMS_PER_PAGE?: number;
    timeRange?: '1h' | '1d' | '7d' | '30d';
    serverId?: number;
}

const getTimeRange = (timeRange: '1h' | '1d' | '7d' | '30d' = '1h') => {
    const now = new Date();
    switch (timeRange) {
        case '1d':
            return {
                start: new Date(now.getTime() - 24 * 60 * 60 * 1000),
                end: now,
                intervalMinutes: 15 // 15 minute intervals
            };
        case '7d':
            return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
                end: now,
                intervalMinutes: 60 // 1 hour intervals
            };
        case '30d':
            return {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
                end: now,
                intervalMinutes: 240 // 4 hour intervals
            };
        case '1h':
        default:
            return {
                start: new Date(now.getTime() - 60 * 60 * 1000),
                end: now,
                intervalMinutes: 1 // 1 minute intervals
            };
    }
};

const getIntervals = (timeRange: '1h' | '1d' | '7d' | '30d' = '1h') => {
    const { start, end, intervalMinutes } = getTimeRange(timeRange);
    
    let intervalCount: number;
    switch (timeRange) {
        case '1d':
            intervalCount = 96; // 24 hours * 4 (15-minute intervals)
            break;
        case '7d':
            intervalCount = 168; // 7 days * 24 hours
            break;
        case '30d':
            intervalCount = 180; // 30 days * 6 (4-hour intervals)
            break;
        case '1h':
        default:
            intervalCount = 60;
            break;
    }

    // Calculate the total time span in minutes
    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    
    // Create equally spaced intervals
    return Array.from({ length: intervalCount }, (_, i) => {
        const minutesFromEnd = Math.floor(i * (totalMinutes / (intervalCount - 1)));
        const d = new Date(end.getTime() - minutesFromEnd * 60 * 1000);
        return d;
    }).reverse(); // Return in chronological order
};

const parseUsageValue = (value: string | null): number => {
    if (!value) return 0;
    return Math.round(parseFloat(value.replace('%', '')) * 100) / 100;
};

export async function POST(request: NextRequest) {
    try {
        const body: GetRequest = await request.json();
        const page = Math.max(1, body.page || 1);
        const ITEMS_PER_PAGE = body.ITEMS_PER_PAGE || 4;
        const timeRange = body.timeRange || '1h';
        const serverId = body.serverId;

        // If serverId is provided, only fetch that specific server
        const hostsQuery = serverId 
            ? { id: serverId }
            : { hostServer: 0 };
        
        let hosts;
        if (!serverId) {
            hosts = await prisma.server.findMany({
                where: hostsQuery,
                orderBy: { name: 'asc' as Prisma.SortOrder },
                skip: (page - 1) * ITEMS_PER_PAGE,
                take: ITEMS_PER_PAGE,
            });
        } else {
            hosts = await prisma.server.findMany({
                where: hostsQuery,
                orderBy: { name: 'asc' as Prisma.SortOrder },
            });
        }

        const { start } = getTimeRange(timeRange);
        const intervals = getIntervals(timeRange);

        const hostsWithVms = await Promise.all(
            hosts.map(async (host) => {
                const vms = await prisma.server.findMany({
                    where: { hostServer: host.id },
                    orderBy: { name: 'asc' }
                });
                
                // Get server history for the host
                const serverHistory = await prisma.server_history.findMany({
                    where: {
                        serverId: host.id,
                        createdAt: {
                            gte: start
                        }
                    },
                    orderBy: {
                        createdAt: 'asc'
                    }
                });

                // Process history data into intervals
                const historyMap = new Map<string, { 
                    cpu: number[],
                    ram: number[],
                    disk: number[],
                    gpu: number[],
                    temp: number[],
                    online: boolean[]
                }>();

                // Initialize intervals
                intervals.forEach(date => {
                    const key = date.toISOString();
                    historyMap.set(key, {
                        cpu: [],
                        ram: [],
                        disk: [],
                        gpu: [],
                        temp: [],
                        online: []
                    });
                });

                // Group data by interval
                serverHistory.forEach(record => {
                    const recordDate = new Date(record.createdAt);
                    let nearestInterval: Date = intervals[0];
                    let minDiff = Infinity;

                    // Find the nearest interval for this record
                    intervals.forEach(intervalDate => {
                        const diff = Math.abs(recordDate.getTime() - intervalDate.getTime());
                        if (diff < minDiff) {
                            minDiff = diff;
                            nearestInterval = intervalDate;
                        }
                    });

                    const key = nearestInterval.toISOString();
                    const interval = historyMap.get(key);
                    if (interval) {
                        interval.cpu.push(parseUsageValue(record.cpuUsage));
                        interval.ram.push(parseUsageValue(record.ramUsage));
                        interval.disk.push(parseUsageValue(record.diskUsage));
                        interval.gpu.push(parseUsageValue(record.gpuUsage));
                        interval.temp.push(parseUsageValue(record.temp));
                        interval.online.push(record.online);
                    }
                });

                // Calculate averages for each interval
                const historyData = intervals.map(date => {
                    const key = date.toISOString();
                    const data = historyMap.get(key) || {
                        cpu: [],
                        ram: [],
                        disk: [],
                        gpu: [],
                        temp: [],
                        online: []
                    };

                    const average = (arr: number[]) => 
                        arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : null;

                    return {
                        timestamp: key,
                        cpu: average(data.cpu),
                        ram: average(data.ram),
                        disk: average(data.disk),
                        gpu: average(data.gpu),
                        temp: average(data.temp),
                        online: data.online.length ? 
                            data.online.filter(Boolean).length / data.online.length >= 0.5 
                            : null
                    };
                });
                
                // Add isVM flag to VMs
                const vmsWithFlag = vms.map(vm => ({
                    ...vm,
                    isVM: true,
                    hostedVMs: [] // Initialize empty hostedVMs array for VMs
                }));
                
                return {
                    ...host,
                    isVM: false,
                    hostedVMs: vmsWithFlag,
                    history: {
                        labels: intervals.map(d => d.toISOString()),
                        datasets: {
                            cpu: intervals.map(d => {
                                const data = historyMap.get(d.toISOString())?.cpu || [];
                                return data.length ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100 : null;
                            }),
                            ram: intervals.map(d => {
                                const data = historyMap.get(d.toISOString())?.ram || [];
                                return data.length ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100 : null;
                            }),
                            disk: intervals.map(d => {
                                const data = historyMap.get(d.toISOString())?.disk || [];
                                return data.length ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100 : null;
                            }),
                            gpu: intervals.map(d => {
                                const data = historyMap.get(d.toISOString())?.gpu || [];
                                return data.length ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100 : null;
                            }),
                            temp: intervals.map(d => {
                                const data = historyMap.get(d.toISOString())?.temp || [];
                                return data.length ? Math.round((data.reduce((a, b) => a + b) / data.length) * 100) / 100 : null;
                            }),
                            online: intervals.map(d => {
                                const data = historyMap.get(d.toISOString())?.online || [];
                                return data.length ? data.filter(Boolean).length / data.length >= 0.5 : null;
                            })
                        }
                    }
                };
            })
        );

        // Only calculate maxPage when not requesting a specific server
        let maxPage = 1;
        let totalHosts = 0;
        if (!serverId) {
            totalHosts = await prisma.server.count({
                where: { OR: [{ hostServer: 0 }, { hostServer: null }] }
            });
            maxPage = Math.ceil(totalHosts / ITEMS_PER_PAGE);
        }

        return NextResponse.json({ 
            servers: hostsWithVms,
            maxPage,
            totalItems: totalHosts
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}