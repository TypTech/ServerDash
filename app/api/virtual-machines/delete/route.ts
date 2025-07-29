import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface DeleteRequest {
  id: number
}

export async function POST(request: NextRequest) {
  try {
    const body: DeleteRequest = await request.json();
    const { id } = body;

    const existingVirtualMachine = await prisma.virtual_machine.findUnique({ where: { id } });
    if (!existingVirtualMachine) {
      return NextResponse.json({ error: "Virtual machine not found" }, { status: 404 });
    }

    await prisma.virtual_machine.delete({ where: { id } });

    return NextResponse.json({ message: "Virtual machine deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}