import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import Fuse from "fuse.js";

interface SearchRequest {
    searchterm: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: SearchRequest = await request.json();
        const { searchterm } = body;  
        
        // Fetch all servers
        const servers = await prisma.server.findMany({});
        
        // Create a map of host servers with their hosted VMs
        const serverMap = new Map();
        servers.forEach(server => {
            if (server.host) {
                serverMap.set(server.id, {
                    ...server,
                    isVM: false,
                    hostedVMs: []
                });
            }
        });
        
        // Add VMs to their host servers and mark them as VMs
        const serversWithType = servers.map(server => {
            // If not a host and has a hostServer, it's a VM
            if (!server.host && server.hostServer) {
                const hostServer = serverMap.get(server.hostServer);
                if (hostServer) {
                    hostServer.hostedVMs.push({
                        ...server,
                        isVM: true
                    });
                }
                return {
                    ...server,
                    isVM: true
                };
            }
            return {
                ...server,
                isVM: false,
                hostedVMs: serverMap.get(server.id)?.hostedVMs || []
            };
        });

        const fuseOptions = {
            keys: ['name', 'description', 'cpu', 'gpu', 'ram', 'disk', 'os'],
            threshold: 0.3,
            includeScore: true,
        };

        const fuse = new Fuse(serversWithType, fuseOptions);
        
        const searchResults = fuse.search(searchterm);

        const results = searchResults.map(({ item }) => item);

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}