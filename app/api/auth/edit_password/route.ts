import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

interface EditEmailRequest {
    oldPassword: string;
    newPassword: string;
    jwtToken: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: EditEmailRequest = await request.json();
        const { oldPassword, newPassword, jwtToken } = body;

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

        // Check if the old password is correct
        const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
        if (!isOldPasswordValid) {
            return NextResponse.json({ error: 'Old password is incorrect' }, { status: 401 });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        // Update the user's password
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedNewPassword },
        });
    
        return NextResponse.json({ message: 'Password updated successfully' });	
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}