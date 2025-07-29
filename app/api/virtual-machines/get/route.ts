import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface PostRequest {
  page?: number
  ITEMS_PER_PAGE?: number
}

export async function POST(request: NextRequest) {
  try {
    const body: PostRequest = await request.json();
    const page = Math.max(1, body.page || 1);
    const ITEMS_PER_PAGE = body.ITEMS_PER_PAGE || 10;

    const [virtualMachines, totalCount, servers_all] = await Promise.all([
      prisma.virtual_machine.findMany({
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
        orderBy: { name: "asc" }
      }),
      prisma.virtual_machine.count(),
      prisma.server.findMany()
    ]);

    const serverIds = virtualMachines
    .map((vm: { serverId: number | null }) => vm.serverId)
    .filter((id:any): id is number => id !== null);

    const servers = await prisma.server.findMany({
      where: { id: { in: serverIds } }
    });

    const virtualMachinesWithServers = virtualMachines.map((vm: any) => ({
        ...vm,
        server: servers.find((s: any) => s.id === vm.serverId)?.name || "No server"
      }));

    const maxPage = Math.ceil(totalCount / ITEMS_PER_PAGE);

    return NextResponse.json({
      virtualMachines: virtualMachinesWithServers,
      servers: servers_all,
      maxPage,
      totalItems: totalCount
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}