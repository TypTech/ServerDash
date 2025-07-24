import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface EditRequest {
    host?: boolean;
    hostServer?: number;
    id: number;
    name?: string;
    icon?: string;
    os?: string;
    ip?: string;
    url?: string;
    cpu?: string;
    gpu?: string;
    ram?: string;
    disk?: string;
    monitoring?: boolean;
    monitoringURL?: string;
}

// Input validation and sanitization for server edit
function validateServerEditInput(data: any): { isValid: boolean; errors: string[]; sanitized?: EditRequest } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.id || typeof data.id !== 'number') {
        errors.push('Server ID is required and must be a number');
    }
    
    if (data.name !== undefined && (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0)) {
        errors.push('Server name must be a non-empty string if provided');
    }
    
    // IP format validation if provided
    if (data.ip && typeof data.ip === 'string' && data.ip.trim().length > 0) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        if (!ipRegex.test(data.ip.trim())) {
            errors.push('IP address must be a valid IPv4 or IPv6 address');
        }
    }
    
    // URL validation if provided
    if (data.url && typeof data.url === 'string' && data.url.trim().length > 0) {
        try {
            new URL(data.url);
        } catch {
            errors.push('URL must be a valid URL format');
        }
    }
    
    // Monitoring URL validation if provided
    if (data.monitoringURL && typeof data.monitoringURL === 'string' && data.monitoringURL.trim().length > 0) {
        try {
            new URL(data.monitoringURL);
        } catch {
            errors.push('Monitoring URL must be a valid URL format');
        }
    }
    
    // Type validations
    if (data.host !== undefined && typeof data.host !== 'boolean') {
        errors.push('Host field must be a boolean');
    }
    
    if (data.hostServer !== undefined && typeof data.hostServer !== 'number' && data.hostServer !== null) {
        errors.push('Host server field must be a number or null');
    }
    
    if (data.monitoring !== undefined && typeof data.monitoring !== 'boolean') {
        errors.push('Monitoring field must be a boolean');
    }
    
    if (errors.length === 0) {
        const sanitized: EditRequest = { id: data.id };
        
        // Only include fields that were provided
        if (data.host !== undefined) sanitized.host = data.host;
        if (data.hostServer !== undefined) sanitized.hostServer = data.hostServer;
        if (data.name !== undefined) sanitized.name = data.name.trim();
        if (data.icon !== undefined) sanitized.icon = data.icon;
        if (data.os !== undefined) sanitized.os = data.os;
        if (data.ip !== undefined) sanitized.ip = data.ip.trim();
        if (data.url !== undefined) sanitized.url = data.url.trim();
        if (data.cpu !== undefined) sanitized.cpu = data.cpu;
        if (data.gpu !== undefined) sanitized.gpu = data.gpu;
        if (data.ram !== undefined) sanitized.ram = data.ram;
        if (data.disk !== undefined) sanitized.disk = data.disk;
        if (data.monitoring !== undefined) sanitized.monitoring = data.monitoring;
        if (data.monitoringURL !== undefined) sanitized.monitoringURL = data.monitoringURL.trim();
        
        return {
            isValid: true,
            errors: [],
            sanitized
        };
    }
    
    return { isValid: false, errors };
}

async function handleServerEdit(request: NextRequest) {
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

        const validation = validateServerEditInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.errors }, 
                { status: 400 }
            );
        }

        const validatedData = validation.sanitized!;
        const { id } = validatedData;

        // Check if server exists
        const existingServer = await prisma.server.findUnique({ where: { id } });
        if (!existingServer) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }

        // Prepare update data (only include provided fields)
        const updateData: any = {};
        
        // Handle special case for hostServer conversion
        if (validatedData.hostServer !== undefined) {
            updateData.hostServer = validatedData.hostServer === null ? 0 : validatedData.hostServer;
        }
        
        // Add other fields if provided
        if (validatedData.host !== undefined) updateData.host = validatedData.host;
        if (validatedData.name !== undefined) updateData.name = validatedData.name;
        if (validatedData.icon !== undefined) updateData.icon = validatedData.icon;
        if (validatedData.os !== undefined) updateData.os = validatedData.os;
        if (validatedData.ip !== undefined) updateData.ip = validatedData.ip;
        if (validatedData.url !== undefined) updateData.url = validatedData.url;
        if (validatedData.cpu !== undefined) updateData.cpu = validatedData.cpu;
        if (validatedData.gpu !== undefined) updateData.gpu = validatedData.gpu;
        if (validatedData.ram !== undefined) updateData.ram = validatedData.ram;
        if (validatedData.disk !== undefined) updateData.disk = validatedData.disk;
        if (validatedData.monitoring !== undefined) updateData.monitoring = validatedData.monitoring;
        if (validatedData.monitoringURL !== undefined) updateData.monitoringURL = validatedData.monitoringURL;

        const updatedServer = await prisma.server.update({
            where: { id },
            data: updateData
        });

        return NextResponse.json({ 
            message: "Server updated successfully", 
            server: updatedServer 
        });
    } catch (error: any) {
        console.error('Server edit error:', error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    return handleServerEdit(request);
}

export async function PATCH(request: NextRequest) {
    return handleServerEdit(request);
}

export async function POST(request: NextRequest) {
    return handleServerEdit(request);
}