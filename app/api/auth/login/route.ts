import { NextResponse, NextRequest } from "next/server";
import jwt from 'jsonwebtoken';
import { prisma } from "@/lib/prisma";
import bcrypt from 'bcryptjs';

interface LoginRequest {
    username: string;
    password: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: LoginRequest = await request.json();
        const { username, password } = body;
        
        // Ensure JWT_SECRET is defined
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not defined');
        }

        let accountId: string = '';
        // Check if there are any entries in user
        const userCount = await prisma.user.count();
        if (userCount === 0) {
            if(username=== "admin@example.com" && password === "admin") {
                // Hash the password
                const hashedPassword = await bcrypt.hash(password, 10);
                // Create the first user with hashed password
                const user = await prisma.user.create({
                    data: {
                        email: username,
                        password: hashedPassword,
                    },
                });

                // Get the account id
                accountId = user.id;            
            } else {
                return NextResponse.json({ error: "Wrong credentials" }, { status: 401 });
            }
        } else {
            // Get the user by username
            const user = await prisma.user.findUnique({
                where: { email: username },
            });
            if (!user) {
                return NextResponse.json({ error: "Wrong credentials" }, { status: 401 });
            }
            // Check if the password is correct
            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: "Wrong credentials" }, { status: 401 });
            }
            // Get the account id
            accountId = user.id;
        }

        // Create JWT
        const token = jwt.sign({ account_secret: accountId }, process.env.JWT_SECRET, { expiresIn: '7d' });

        return NextResponse.json({ token });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}