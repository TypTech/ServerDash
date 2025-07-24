import { NextRequest, NextResponse } from 'next/server';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";

interface ValidateRequest {
    token: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: ValidateRequest = await request.json();
        const { token } = body;

        // Validate input
        if (!token || typeof token !== 'string') {
            return NextResponse.json({ error: 'Token is required' }, { status: 400 });
        }

        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload & { account_secret: string };

        if (!decoded.account_secret) {
            return NextResponse.json({ error: 'Invalid token structure' }, { status: 401 });
        }

        // Verify user exists in database
        const user = await prisma.user.findUnique({
            where: { id: decoded.account_secret },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 401 });
        }

        return NextResponse.json({ 
            message: 'Valid token',
            userId: user.id,
            email: user.email 
        });
    } catch (error: any) {
        // Handle specific JWT errors
        if (error.name === 'TokenExpiredError') {
            return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        if (error.name === 'JsonWebTokenError') {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        
        console.error('Token validation error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}