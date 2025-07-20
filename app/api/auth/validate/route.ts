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

        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        // Get the account id
        const user = await prisma.user.findFirst({
            where: {},
        });
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as JwtPayload & { id: string };

        if(!decoded.account_secret) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        if(decoded.account_secret !== user.id) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }


        return NextResponse.json({ message: 'Valid token' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}