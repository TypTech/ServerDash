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
        
        const applications = await prisma.application.findMany({});

        const fuseOptions = {
            keys: ['name', 'description'],
            threshold: 0.3,
            includeScore: true,
        };

        const fuse = new Fuse(applications, fuseOptions);
        
        const searchResults = fuse.search(searchterm);

        const searchedApps = searchResults.map(({ item }) => item);
        
        // Get server IDs from the search results
        const serverIds = searchedApps
            .map(app => app.serverId)
            .filter((id): id is number => id !== null);

        // Fetch server data for these applications
        const servers = await prisma.server.findMany({
            where: { id: { in: serverIds } }
        });

        // Add server name to each application
        const results = searchedApps.map(app => ({
            ...app,
            server: servers.find(s => s.id === app.serverId)?.name || "No server"
        }));

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}