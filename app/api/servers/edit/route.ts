import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateRequest, logSecurityEvent } from "@/lib/auth-middleware";
import { 
    validateString, 
    validateIPAddress, 
    validateURL, 
    validateBoolean, 
    validateInteger,
    validateObject,
    ValidationResult 
} from "@/lib/validation";

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

// Server input validation schema for editing
function validateServerEditInput(data: any): ValidationResult {
    return validateObject(data, {
        id: (value) => validateInteger(value, {
            required: true,
            min: 1,
            fieldName: 'Server ID'
        }),
        name: (value) => validateString(value, {
            required: true,
            minLength: 1,
            maxLength: 100,
            fieldName: 'Server name'
        }),
        icon: (value) => validateString(value, {
            required: false,
            maxLength: 50,
            fieldName: 'Icon',
            allowEmpty: true
        }),
        os: (value) => validateString(value, {
            required: false,
            maxLength: 50,
            fieldName: 'Operating system',
            allowEmpty: true
        }),
        ip: (value) => validateIPAddress(value, false),
        url: (value) => validateURL(value, {
            required: false,
            fieldName: 'Server URL'
        }),
        cpu: (value) => validateString(value, {
            required: false,
            maxLength: 100,
            fieldName: 'CPU',
            allowEmpty: true
        }),
        gpu: (value) => validateString(value, {
            required: false,
            maxLength: 100,
            fieldName: 'GPU',
            allowEmpty: true
        }),
        ram: (value) => validateString(value, {
            required: false,
            maxLength: 50,
            fieldName: 'RAM',
            allowEmpty: true
        }),
        disk: (value) => validateString(value, {
            required: false,
            maxLength: 100,
            fieldName: 'Disk',
            allowEmpty: true
        }),
        monitoringURL: (value) => validateURL(value, {
            required: false,
            fieldName: 'Monitoring URL'
        }),
        host: (value) => validateBoolean(value, 'Host'),
        monitoring: (value) => validateBoolean(value, 'Monitoring'),
        hostServer: (value) => validateInteger(value, {
            required: false,
            min: 0,
            fieldName: 'Host server ID'
        })
    });
}

export async function PUT(request: NextRequest) {
    try {
        // Authenticate the request
        const authResult = await authenticateRequest(request);
        if (!authResult.isValid) {
            logSecurityEvent('unauthorized_access', { 
                endpoint: '/api/servers/edit',
                error: authResult.error 
            }, request);
            
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: authResult.statusCode || 401 }
            );
        }

        const requestBody = await request.json();
        
        // Validate and sanitize input
        const validation = validateServerEditInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }
        
        // Use sanitized data from validation
        const sanitizedData = validation.sanitized as EditRequest;
        const { id } = sanitizedData;

        // Check if server exists
        const existingServer = await prisma.server.findUnique({ where: { id } });
        if (!existingServer) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }

        // Convert hostServer = 0 to null for database storage (consistent with add route)
        const dbData = {
            host: sanitizedData.host,
            hostServer: sanitizedData.hostServer === 0 ? null : sanitizedData.hostServer,
            name: sanitizedData.name,
            icon: sanitizedData.icon,
            os: sanitizedData.os,
            ip: sanitizedData.ip,
            url: sanitizedData.url,
            cpu: sanitizedData.cpu,
            gpu: sanitizedData.gpu,
            ram: sanitizedData.ram,
            disk: sanitizedData.disk,
            monitoring: sanitizedData.monitoring,
            monitoringURL: sanitizedData.monitoringURL
        };

        const updatedServer = await prisma.server.update({
            where: { id },
            data: dbData
        });

        return NextResponse.json({ 
            message: "Server updated successfully", 
            server: {
                id: updatedServer.id,
                name: updatedServer.name,
                os: updatedServer.os,
                ip: updatedServer.ip
            }
        });
    } catch (error: any) {
        // Log error securely (without exposing sensitive details)
        console.error('Server update error:', {
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
        
        return NextResponse.json(
            { error: "Internal server error" }, 
            { status: 500 }
        );
    }
}