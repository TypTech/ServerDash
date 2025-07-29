import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface EditRequest {
  id: number
  name: string
  description?: string
  serverId: number
  icon: string
  publicURL: string
  localURL?: string
  uptimecheckUrl?: string
}

export async function PUT(request: NextRequest) {
    try {
        const body: EditRequest = await request.json();
        const { id, name, description, serverId, icon, publicURL, localURL, uptimecheckUrl } = body;

        const existingVirtualMachine = await prisma.virtual_machine.findUnique({ where: { id } });
        if (!existingVirtualMachine) {
            return NextResponse.json({ error: "Virtual machine not found" }, { status: 404 });
        }

        const updatedVirtualMachine = await prisma.virtual_machine.update({
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

        return NextResponse.json({ message: "Virtual machine updated", virtualMachine: updatedVirtualMachine });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}