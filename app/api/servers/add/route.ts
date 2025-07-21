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

// Server input validation schema
function validateServerInput(data: any): ValidationResult {
    return validateObject(data, {
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

export async function POST(request: NextRequest) {
    try {
        // Authenticate the request
        const authResult = await authenticateRequest(request);
        if (!authResult.isValid) {
            logSecurityEvent('unauthorized_access', { 
                endpoint: '/api/servers/add',
                error: authResult.error 
            }, request);
            
            return NextResponse.json(
                { error: 'Unauthorized' }, 
                { status: authResult.statusCode || 401 }
            );
        }

        const requestBody = await request.json();
        
        // Validate and sanitize input
        const validation = validateServerInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: 'Validation failed', details: validation.errors },
                { status: 400 }
            );
        }
        
        // Use sanitized data from validation
        const sanitizedData = validation.sanitized as AddRequest;
        
        // Convert hostServer = 0 to null for database storage
        const dbData = {
            ...sanitizedData,
            hostServer: sanitizedData.hostServer === 0 ? null : sanitizedData.hostServer
        };
        
        const server = await prisma.server.create({
            data: dbData
        });

        return NextResponse.json({ 
            message: "Server created successfully", 
            server: {
                id: server.id,
                name: server.name,
                os: server.os,
                ip: server.ip
            }
        });
    } catch (error: any) {
        // Log error securely (without exposing sensitive details)
        console.error('Server creation error:', {
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
