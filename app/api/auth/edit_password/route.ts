import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

interface EditPasswordRequest {
    oldPassword: string;
    newPassword: string;
    jwtToken: string;
}

// Input validation and sanitization
function validatePasswordInput(data: any): { isValid: boolean; errors: string[]; sanitized?: EditPasswordRequest } {
    const errors: string[] = [];
    
    if (!data.oldPassword || typeof data.oldPassword !== 'string') {
        errors.push('Old password is required and must be a string');
    }
    
    if (!data.newPassword || typeof data.newPassword !== 'string') {
        errors.push('New password is required and must be a string');
    }
    
    if (!data.jwtToken || typeof data.jwtToken !== 'string') {
        errors.push('JWT token is required and must be a string');
    }
    
    // Password strength validation
    if (data.newPassword && data.newPassword.length < 6) {
        errors.push('New password must be at least 6 characters long');
    }
    
    if (data.newPassword && data.newPassword.length > 128) {
        errors.push('New password is too long');
    }
    
    if (data.oldPassword && data.oldPassword === data.newPassword) {
        errors.push('New password must be different from the old password');
    }
    
    if (errors.length === 0) {
        return {
            isValid: true,
            errors: [],
            sanitized: {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword,
                jwtToken: data.jwtToken.trim()
            }
        };
    }
    
    return { isValid: false, errors };
}

async function handlePasswordUpdate(request: NextRequest) {
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

        const validation = validatePasswordInput(requestBody);
        if (!validation.isValid) {
            return NextResponse.json(
                { error: "Invalid input", details: validation.errors }, 
                { status: 400 }
            );
        }

        const { oldPassword, newPassword, jwtToken } = validation.sanitized!;

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

        // Check if the old password is correct
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return NextResponse.json({ error: 'Old password is incorrect' }, { status: 401 });
        }

        // Hash the new password with higher salt rounds for security
        const hashedNewPassword = await bcrypt.hash(newPassword, 12);
        
        // Update the user's password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });
    
        return NextResponse.json({ 
            message: 'Password updated successfully' 
        });	
    } catch (error: any) {
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        console.error('Password update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    return handlePasswordUpdate(request);
}

export async function PUT(request: NextRequest) {
    return handlePasswordUpdate(request);
}