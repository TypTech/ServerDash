import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface EditRequest {
    host: boolean;
    hostServer: number;
    id: number;
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

export async function PUT(request: NextRequest) {
    try {
        const body: EditRequest = await request.json();
        const { host, hostServer, id, name, icon, os, ip, url, cpu, gpu, ram, disk, monitoring, monitoringURL } = body;

        const existingServer = await prisma.server.findUnique({ where: { id } });
        if (!existingServer) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }

        let newHostServer = hostServer;
        if (hostServer === null) {
            newHostServer = 0;
        } else {
            newHostServer = hostServer;
        }

        const updatedServer = await prisma.server.update({
            where: { id },
            data: { 
                host,
                hostServer: newHostServer,
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

        return NextResponse.json({ message: "Server updated", server: updatedServer });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}