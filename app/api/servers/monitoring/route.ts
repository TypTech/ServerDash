import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma";


export async function GET() {
  try {
    const servers = await prisma.server.findMany({
      select: {
        id: true,
        online: true,
        cpuUsage: true,
        ramUsage: true,
        diskUsage: true,
        gpuUsage: true,
        temp: true,
        uptime: true
      }
    });

    const monitoringData = servers.map((server: {
      id: number;
      online: boolean;
      cpuUsage: string | null;
      ramUsage: string | null;
      diskUsage: string | null;
      gpuUsage: string | null;
      temp: string | null;
      uptime: string | null;
    }) => ({
      id: server.id,
      online: server.online,
      cpuUsage: server.cpuUsage ? parseFloat(server.cpuUsage) : 0,
      ramUsage: server.ramUsage ? parseFloat(server.ramUsage) : 0,
      diskUsage: server.diskUsage ? parseFloat(server.diskUsage) : 0,
      gpuUsage: server.gpuUsage ? parseFloat(server.gpuUsage) : 0,
      temp: server.temp ? parseFloat(server.temp) : 0,
      uptime: server.uptime || ""
    }));

    return NextResponse.json(monitoringData)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
} 