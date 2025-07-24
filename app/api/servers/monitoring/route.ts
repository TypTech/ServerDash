import { NextResponse, NextRequest } from "next/server"
import { prisma } from "@/lib/prisma";

interface MonitoringRequest {
    serverIds?: number[];
    includeHistory?: boolean;
    timeRange?: '1h' | '1d' | '7d' | '30d';
}

// Input validation for monitoring request
function validateMonitoringInput(data: any): { isValid: boolean; errors: string[]; sanitized?: MonitoringRequest } {
    const errors: string[] = [];
    
    // Optional serverIds validation
    if (data.serverIds !== undefined) {
        if (!Array.isArray(data.serverIds)) {
            errors.push('Server IDs must be an array');
        } else {
            const invalidIds = data.serverIds.filter((id: any) => typeof id !== 'number' || id <= 0);
            if (invalidIds.length > 0) {
                errors.push('All server IDs must be positive numbers');
            }
        }
    }
    
    // Optional timeRange validation
    if (data.timeRange !== undefined) {
        const validRanges = ['1h', '1d', '7d', '30d'];
        if (!validRanges.includes(data.timeRange)) {
            errors.push('Time range must be one of: 1h, 1d, 7d, 30d');
        }
    }
    
    // Optional includeHistory validation
    if (data.includeHistory !== undefined && typeof data.includeHistory !== 'boolean') {
        errors.push('Include history must be a boolean');
    }
    
    if (errors.length === 0) {
        return {
            isValid: true,
            errors: [],
            sanitized: {
                serverIds: data.serverIds,
                includeHistory: data.includeHistory || false,
                timeRange: data.timeRange || '1h'
            }
        };
    }
    
    return { isValid: false, errors };
}

async function handleMonitoringRequest(request: NextRequest | null = null) {
    try {
        let requestData: MonitoringRequest = {
            includeHistory: false,
            timeRange: '1h'
        };

        // Parse request body if this is a POST request
        if (request) {
            try {
                const body = await request.json();
                const validation = validateMonitoringInput(body);
                if (!validation.isValid) {
                    return NextResponse.json(
                        { error: "Invalid input", details: validation.errors }, 
                        { status: 400 }
                    );
                }
                requestData = validation.sanitized!;
            } catch {
                // If parsing fails, use defaults (for GET requests)
            }
        }

        // Build where clause for server filtering
        const whereClause = requestData.serverIds ? 
            { id: { in: requestData.serverIds } } : 
            {};

        const servers = await prisma.server.findMany({
            where: whereClause,
            select: {
                id: true,
                name: true,
                host: true,
                online: true,
                cpuUsage: true,
                ramUsage: true,
                diskUsage: true,
                gpuUsage: true,
                temp: true,
                uptime: true,
                monitoring: true,
                ip: true
            }
        });

        const monitoringData = servers.map((server) => ({
            id: server.id,
            name: server.name,
            host: server.host,
            online: server.online,
            cpuUsage: server.cpuUsage ? parseFloat(server.cpuUsage.replace('%', '')) : 0,
            ramUsage: server.ramUsage ? parseFloat(server.ramUsage.replace('%', '')) : 0,
            diskUsage: server.diskUsage ? parseFloat(server.diskUsage.replace('%', '')) : 0,
            gpuUsage: server.gpuUsage ? parseFloat(server.gpuUsage.replace('%', '')) : 0,
            temp: server.temp ? parseFloat(server.temp.replace('°C', '')) : 0,
            uptime: server.uptime || "0m",
            monitoring: server.monitoring,
            ip: server.ip,
            lastUpdated: new Date().toISOString()
        }));

        // Add history data if requested
        if (requestData.includeHistory) {
            const now = new Date();
            const timeRangeMs = {
                '1h': 60 * 60 * 1000,
                '1d': 24 * 60 * 60 * 1000,
                '7d': 7 * 24 * 60 * 60 * 1000,
                '30d': 30 * 24 * 60 * 60 * 1000
            };
            
            const startTime = new Date(now.getTime() - timeRangeMs[requestData.timeRange!]);
            
            const history = await prisma.server_history.findMany({
                where: {
                    serverId: requestData.serverIds ? { in: requestData.serverIds } : undefined,
                    createdAt: { gte: startTime }
                },
                orderBy: { createdAt: 'asc' }
            });

            return NextResponse.json({
                servers: monitoringData,
                history,
                timeRange: requestData.timeRange,
                totalServers: monitoringData.length
            });
        }

        return NextResponse.json({
            servers: monitoringData,
            totalServers: monitoringData.length,
            timestamp: new Date().toISOString()
        });
    } catch (error: any) {
        console.error('Monitoring data error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function GET() {
    return handleMonitoringRequest();
}

export async function POST(request: NextRequest) {
    return handleMonitoringRequest(request);
} 