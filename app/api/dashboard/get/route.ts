import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        // Get all servers and filter by hostServer field
        const allServers = await prisma.server.findMany();
        const serverCountNoVMs = allServers.filter((s: any) => !s.hostServer || s.hostServer === 0).length;
        const serverCountOnlyVMs = allServers.filter((s: any) => s.hostServer && s.hostServer !== 0).length;

        const applicationCount = await prisma.application.count();

        const onlineApplicationsCount = await prisma.application.count({
            where: { online: true }
        });

        const networkDeviceCount = await (prisma as any).network_device.count();

        const onlineNetworkDeviceCount = await (prisma as any).network_device.count({
            where: { online: true }
        });

        return NextResponse.json({
            serverCountNoVMs,
            serverCountOnlyVMs,
            applicationCount,
            onlineApplicationsCount,
            networkDeviceCount,
            onlineNetworkDeviceCount
        });
    } catch (error: any) {
        console.error('Dashboard API error:', error);
        return NextResponse.json({ 
            error: error.message,
            serverCountNoVMs: 0,
            serverCountOnlyVMs: 0,
            applicationCount: 0,
            onlineApplicationsCount: 0,
            networkDeviceCount: 0,
            onlineNetworkDeviceCount: 0
        }, { status: 500 });
    }
}
