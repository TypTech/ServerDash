import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const serverCountNoVMs = await prisma.server.count({
            where: {
                hostServer: 0
            }
        });

        const serverCountOnlyVMs = await prisma.server.count({
            where: {
                hostServer: {
                    not: 0
                }
            }
        });

        const applicationCount = await prisma.application.count();

        const onlineApplicationsCount = await prisma.application.count({
            where: { online: true }
        });

        return NextResponse.json({
            serverCountNoVMs,
            serverCountOnlyVMs,
            applicationCount,
            onlineApplicationsCount
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
