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
        
        const server = await prisma.server.create({
            data: {
                host,
                hostServer,
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

        return NextResponse.json({ message: "Success", server });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
