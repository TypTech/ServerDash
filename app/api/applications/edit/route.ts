import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface EditRequest {
    id: number;
    name: string;
    description: string;
    serverId: number;
    icon: string;
    publicURL: string;
    localURL: string;
    uptimecheckUrl: string;
}

export async function PUT(request: NextRequest) {
    try {
        const body: EditRequest = await request.json();
        const { id, name, description, serverId, icon, publicURL, localURL, uptimecheckUrl } = body;

        const existingApp = await prisma.application.findUnique({ where: { id } });
        if (!existingApp) {
            return NextResponse.json({ error: "Server not found" }, { status: 404 });
        }

        const updatedApplication = await prisma.application.update({
            where: { id },
            data: { 
                serverId,
                name, 
                description,
                icon,
                publicURL,
                localURL,
                uptimecheckUrl
            }
        });

        return NextResponse.json({ message: "Application updated", application: updatedApplication });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}