import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const servers = await prisma.server.findMany({
            where: { host: true },
        });
        
        // Add required properties to ensure consistency
        const serversWithProps = servers.map(server => ({
            ...server,
            isVM: false,
            hostedVMs: [] // Initialize empty hostedVMs array
        }));
        
        return NextResponse.json({ servers: serversWithProps });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}