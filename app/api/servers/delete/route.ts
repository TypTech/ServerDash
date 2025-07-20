import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = Number(body.id);

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }
    
    // Check if there are any applications associated with the server
    const applications = await prisma.application.findMany({
      where: { serverId: id }
    });
    if (applications.length > 0) {
      return NextResponse.json({ error: "Cannot delete server with associated applications" }, { status: 400 });
    }

    // Delete all server history records for this server
    await prisma.server_history.deleteMany({
      where: { serverId: id }
    });

    // Delete the server
    await prisma.server.delete({
      where: { id: id }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}