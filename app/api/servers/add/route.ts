import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    host?: boolean;
    hostServer?: number;
    name: string;
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

// Input validation and sanitization
function validateServerInput(data: any): { isValid: boolean; errors: string[]; sanitized?: AddRequest } {
    const errors: string[] = [];
    
    // Required fields validation
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
        errors.push('Server name is required and must be a non-empty string');
    }
    
    // IP address validation (required for monitoring servers)
    if (data.monitoring && (!data.ip || typeof data.ip !== 'string' || data.ip.trim().length === 0)) {
        errors.push('IP address is required for monitoring servers');
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
    
    // Monitoring URL validation if monitoring is enabled
    if (data.monitoring && data.monitoringURL && typeof data.monitoringURL === 'string' && data.monitoringURL.trim().length > 0) {
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
        return {
            isValid: true,
            errors: [],
            sanitized: {
                host: data.host || false,
                hostServer: data.hostServer || 0,
                name: data.name.trim(),
                icon: data.icon || '',
                os: data.os || '',
                ip: data.ip ? data.ip.trim() : '',
                url: data.url ? data.url.trim() : '',
                cpu: data.cpu || '',
                gpu: data.gpu || '',
                ram: data.ram || '',
                disk: data.disk || '',
                monitoring: data.monitoring || false,
                monitoringURL: data.monitoringURL ? data.monitoringURL.trim() : ''
            }
        };
    }
    
    return { isValid: false, errors };
}

export async function POST(request: NextRequest) {
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

        const validation = validateServerInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.errors }, 
                { status: 400 }
            );
        }

        const { host, hostServer, name, icon, os, ip, url, cpu, gpu, ram, disk, monitoring, monitoringURL } = validation.sanitized!;

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
