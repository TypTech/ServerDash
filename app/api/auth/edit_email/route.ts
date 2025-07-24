import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";

interface EditEmailRequest {
    newEmail: string;
    jwtToken: string;
}

// Input validation and sanitization
function validateEmailInput(data: any): { isValid: boolean; errors: string[]; sanitized?: EditEmailRequest } {
    const errors: string[] = [];
    
    if (!data.newEmail || typeof data.newEmail !== 'string') {
        errors.push('New email is required and must be a string');
    }
    
    if (!data.jwtToken || typeof data.jwtToken !== 'string') {
        errors.push('JWT token is required and must be a string');
    }
    
    // Basic email format validation
    if (data.newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.newEmail)) {
        errors.push('New email must be a valid email address');
    }
    
    // Check for reasonable length limits
    if (data.newEmail && data.newEmail.length > 254) {
        errors.push('Email is too long');
    }
    
    if (errors.length === 0) {
        return {
            isValid: true,
            errors: [],
            sanitized: {
                newEmail: data.newEmail.trim().toLowerCase(),
                jwtToken: data.jwtToken.trim()
            }
        };
    }
    
    return { isValid: false, errors };
}

async function handleEmailUpdate(request: NextRequest) {
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

        const validation = validateEmailInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.errors }, 
                { status: 400 }
            );
        }

        const { newEmail, jwtToken } = validation.sanitized!;

        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Verify JWT
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET) as { account_secret: string };
        if (!decoded.account_secret) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Get the user by account id
        const user = await prisma.user.findUnique({
            where: { id: decoded.account_secret },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        // Check if the new email is the same as current
        if (user.email === newEmail) {
            return NextResponse.json({ error: 'New email is the same as current email' }, { status: 400 });
        }

        // Check if the new email is already in use
        const existingUser = await prisma.user.findUnique({
            where: { email: newEmail },
        });

        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }

        // Update the user's email
        await prisma.user.update({
            where: { id: user.id },
            data: { email: newEmail },
        });

        return NextResponse.json({ 
            message: 'Email updated successfully',
            newEmail: newEmail 
        });	
    } catch (error: any) {
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        console.error('Email update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return handleEmailUpdate(request);
}

export async function PUT(request: NextRequest) {
    return handleEmailUpdate(request);
}