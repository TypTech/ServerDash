import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(request: NextRequest) {
    try {
        
        const notifications = await prisma.notification.findMany();

        return NextResponse.json({ 
            notifications
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}