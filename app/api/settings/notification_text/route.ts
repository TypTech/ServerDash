import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    text_application: string;
    text_server: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { text_application, text_server } = body;  
        
        // Check if there is already a settings entry
        const existingSettings = await prisma.settings.findFirst();
        if (existingSettings) {
            // Update the existing settings entry
            const updatedSettings = await prisma.settings.update({
                where: { id: existingSettings.id },
                data: { notification_text_application: text_application, notification_text_server: text_server },
            });
            return NextResponse.json({ message: "Success", updatedSettings });
        }
        // If no settings entry exists, create a new one
        const settings = await prisma.settings.create({
            data: {
                notification_text_application: text_application,
                notification_text_server: text_server,
            }
        });

        return NextResponse.json({ message: "Success", settings });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
