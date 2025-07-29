import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import Fuse from "fuse.js"

interface SearchRequest {
  searchterm: string
}

export async function POST(request: NextRequest) {
    try {
        const body: SearchRequest = await request.json();
        const { searchterm } = body;  
        
        const virtualMachines = await prisma.virtual_machine.findMany({});

        const fuseOptions = {
            keys: ['name', 'description'],
            threshold: 0.3,
            includeScore: true,
        };

        const fuse = new Fuse(virtualMachines, fuseOptions);
        
        const searchResults = fuse.search(searchterm);

        const searchedVMs = searchResults.map(({ item }) => item);
        
        // Get server IDs from the search results
        const serverIds = searchedVMs
            .map(vm => vm.serverId)
            .filter((id): id is number => id !== null);

        // Fetch server data for these virtual machines
        const servers = await prisma.server.findMany({
            where: { id: { in: serverIds } }
        });

        // Add server name to each virtual machine
        const results = searchedVMs.map(vm => ({
            ...vm,
            server: servers.find(s => s.id === vm.serverId)?.name || "No server"
        }));

        return NextResponse.json({ results });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}