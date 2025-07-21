import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    host: boolean;
    hostServer: number;
    name: string;
    icon: string;
    os: string;
    ip: string;
    url: string;
    cpu: string;
    gpu: string;
    ram: string;
    disk: string;
    monitoring: boolean;
    monitoringURL: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { host, hostServer, name, icon, os, ip, url, cpu, gpu, ram, disk, monitoring, monitoringURL } = body;
        
        // Basic validation
        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Server name is required" }, { status: 400 });
        }
        
        // Convert hostServer = 0 to null for database storage
        const finalHostServer = hostServer === 0 ? null : hostServer;
        
        const server = await prisma.server.create({
            data: {
                host,
                hostServer: finalHostServer,
                name,
                icon,
                os,
                ip,
                url,
                cpu,
                gpu,
                ram,
                disk,
                monitoring,
                monitoringURL
            }
        });

        return NextResponse.json({ message: "Server created successfully", server });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
