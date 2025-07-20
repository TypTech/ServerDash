import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";


export async function POST(request: NextRequest) {
    try {
        // Check if there are any settings entries
        const existingSettings = await prisma.settings.findFirst();
        if (!existingSettings) {
            return NextResponse.json({ "notification_text_application": "", "notification_text_server": "" });
        }

        // If settings entry exists, fetch it
        const settings = await prisma.settings.findFirst({
            where: { id: existingSettings.id },
        });
        if (!settings) {
            return NextResponse.json({ "notification_text_application": "", "notification_text_server": "" });
        }
        // Return the settings entry
        return NextResponse.json({ "notification_text_application": settings.notification_text_application, "notification_text_server": settings.notification_text_server });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
