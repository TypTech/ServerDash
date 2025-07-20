import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";

interface EditEmailRequest {
    newEmail: string;
    jwtToken: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: EditEmailRequest = await request.json();
        const { newEmail, jwtToken } = body;

        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        // Verify JWT
        const decoded = jwt.verify(jwtToken, process.env.JWT_SECRET) as { account_secret: string };
        if (!decoded.account_secret) {
            return NextResponse.json({ error: 'Invalid token' }, { status: 400 });
        }

        // Get the user by account id
        const user = await prisma.user.findUnique({
            where: { id: decoded.account_secret },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
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

    
        return NextResponse.json({ message: 'Email updated successfully' });	
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}