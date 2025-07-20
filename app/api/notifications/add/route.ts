import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface AddRequest {
    type: string;
    name: string;
    smtpHost?: string;
    smtpPort?: number;
    smtpSecure?: boolean;
    smtpUsername?: string;
    smtpPassword?: string;
    smtpFrom?: string;
    smtpTo?: string;
    telegramToken?: string;
    telegramChatId?: string;
    discordWebhook?: string;
    gotifyUrl?: string;
    gotifyToken?: string;
    ntfyUrl?: string;
    ntfyToken?: string;
    pushoverUrl?: string;
    pushoverToken?: string;
    pushoverUser?: string;
    echobellURL?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: AddRequest = await request.json();
        const { type, name, smtpHost, smtpPort, smtpSecure, smtpUsername, smtpPassword, smtpFrom, smtpTo, telegramToken, telegramChatId, discordWebhook, gotifyUrl, gotifyToken, ntfyUrl, ntfyToken, pushoverUrl, pushoverToken, pushoverUser, echobellURL } = body; 
        
        const notification = await prisma.notification.create({
            data: {
                type: type,
                name: name,
                smtpHost: smtpHost,
                smtpPort: smtpPort,
                smtpFrom: smtpFrom,
                smtpUser: smtpUsername,
                smtpPass: smtpPassword,
                smtpSecure: smtpSecure,
                smtpTo: smtpTo,
                telegramChatId: telegramChatId,
                telegramToken: telegramToken,
                discordWebhook: discordWebhook,
                gotifyUrl: gotifyUrl,
                gotifyToken: gotifyToken,
                ntfyUrl: ntfyUrl,
                ntfyToken: ntfyToken,
                pushoverUrl: pushoverUrl,
                pushoverToken: pushoverToken,
                pushoverUser: pushoverUser,
                echobellURL: echobellURL
            }
        });

        return NextResponse.json({ message: "Success", notification });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
