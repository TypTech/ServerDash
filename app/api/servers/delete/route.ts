import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// Input validation for server deletion
function validateDeleteInput(data: any): { isValid: boolean; errors: string[]; serverId?: number } {
    const errors: string[] = [];
    
    if (!data.id) {
        errors.push('Server ID is required');
    }
    
    const id = Number(data.id);
    if (isNaN(id) || id <= 0) {
        errors.push('Server ID must be a valid positive number');
    }
    
    if (errors.length === 0) {
        return { isValid: true, errors: [], serverId: id };
    }
    
    return { isValid: false, errors };
}

async function handleServerDelete(request: NextRequest) {
    try {
        // Parse and validate request body
        let requestBody;
        try {
            requestBody = await request.json();
        } catch {
            return NextResponse.json(
                { error: "Invalid request format" }, 
                { status: 400 }
            );
        }

        const validation = validateDeleteInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.errors }, 
                { status: 400 }
            );
        }

        const id = validation.serverId!;

        // Check if server exists
        const existingServer = await prisma.server.findUnique({
            where: { id }
        });

        if (!existingServer) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }
        
        // Check if there are any applications associated with the server
        const applications = await prisma.application.findMany({
            where: { serverId: id }
        });
        
        if (applications.length > 0) {
            return NextResponse.json({ 
                error: "Cannot delete server with associated applications. Please remove applications first." 
            }, { status: 400 });
        }

        // Check if this server has VMs
        const hostedVMs = await prisma.server.findMany({
            where: { hostServer: id }
        });

        if (hostedVMs.length > 0) {
            return NextResponse.json({ 
                error: "Cannot delete server that hosts virtual machines. Please remove VMs first." 
            }, { status: 400 });
        }

        // Delete all server history records for this server
        await prisma.server_history.deleteMany({
            where: { serverId: id }
        });

        // Delete the server
        await prisma.server.delete({
            where: { id }
        });

        return NextResponse.json({ 
            success: true, 
            message: "Server deleted successfully" 
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }
        
        console.error('Server delete error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return handleServerDelete(request);
}

export async function DELETE(request: NextRequest) {
    return handleServerDelete(request);
}