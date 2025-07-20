import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    notificationId: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { notificationId } = body; 
        
        const notification = await prisma.test_notification.create({
            data: {
                notificationId: notificationId,
            }
        });

        return NextResponse.json({ message: "Success", notification });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
