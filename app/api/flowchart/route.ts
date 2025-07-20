import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

interface Node {
  id: string;
  type: string;
  data: {
    label: string;
    [key: string]: any;
  };
  position: { x: number; y: number };
  style: React.CSSProperties;
  draggable?: boolean;
  selectable?: boolean;
  zIndex?: number;
}

interface Edge {
  id: string;
  source: string;
  target: string;
  type: string;
  style: {
    stroke: string;
    strokeWidth: number;
  };
}

interface Server {
  id: number;
  name: string;
  ip: string;
  host: boolean;
  hostServer: number | null;
}

interface Application {
  id: number;
  name: string;
  localURL: string;
  serverId: number;
}

const NODE_WIDTH = 220;
const NODE_HEIGHT = 60;
const APP_NODE_WIDTH = 160;
const APP_NODE_HEIGHT = 40;
const HORIZONTAL_SPACING = 700;
const VERTICAL_SPACING = 80;
const START_Y = 120;
const ROOT_NODE_WIDTH = 300;
const CONTAINER_PADDING = 40;
const COLUMN_SPACING = 220;
const VM_APP_SPACING = 220;
const MIN_VM_SPACING = 10;
const APP_ROW_SPACING = 15;

export async function GET() {
  try {
    const [servers, applications] = await Promise.all([
      prisma.server.findMany({
        orderBy: { id: "asc" },
      }) as Promise<Server[]>,
      prisma.application.findMany({
        orderBy: { serverId: "asc" },
      }) as Promise<Application[]>,
    ]);

    // Level 2: Physical Servers
    const serverNodes: Node[] = servers
      .filter(server => !server.hostServer)
      .map((server, index, filteredServers) => {
        const xPos = 
          index * HORIZONTAL_SPACING - 
          ((filteredServers.length - 1) * HORIZONTAL_SPACING) / 2;

        return {
          id: `server-${server.id}`,
          type: "server",
          data: {
            label: `${server.name}\n${server.ip}`,
            ...server,
          },
          position: { x: xPos, y: START_Y },
          style: {
            background: "#ffffff",
            color: "#0f0f0f",
            border: "2px solid #e6e4e1",
            borderRadius: "4px",
            padding: "8px",
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            fontSize: "0.9rem",
            lineHeight: "1.2",
            whiteSpace: "pre-wrap",
          },
        };
      });

    // Level 3: Services and VMs
    const serviceNodes: Node[] = [];
    const vmNodes: Node[] = [];
    
    servers.forEach((server) => {
      const serverNode = serverNodes.find((n) => n.id === `server-${server.id}`);
      if (serverNode) {
        const serverX = serverNode.position.x;
        
        // Services (left column)
        applications
          .filter(app => app.serverId === server.id)
          .forEach((app, appIndex) => {
            serviceNodes.push({
              id: `service-${app.id}`,
              type: "service",
              data: {
                label: `${app.name}\n${app.localURL}`,
                ...app,
              },
              position: {
                x: serverX - COLUMN_SPACING,
                y: START_Y + NODE_HEIGHT + VERTICAL_SPACING + appIndex * (APP_NODE_HEIGHT + 20),
              },
              style: {
                background: "#f0f9ff",
                color: "#0f0f0f",
                border: "2px solid #60a5fa",
                borderRadius: "4px",
                padding: "6px",
                width: APP_NODE_WIDTH,
                height: APP_NODE_HEIGHT,
                fontSize: "0.8rem",
                lineHeight: "1.1",
                whiteSpace: "pre-wrap",
              },
            });
          });

        // VMs (middle column) mit dynamischem Abstand
        const hostVMs = servers.filter(vm => vm.hostServer === server.id);
        let currentY = START_Y + NODE_HEIGHT + VERTICAL_SPACING;
        
        hostVMs.forEach(vm => {
          const appCount = applications.filter(app => app.serverId === vm.id).length;
          
          vmNodes.push({
            id: `vm-${vm.id}`,
            type: "vm",
            data: {
              label: `${vm.name}\n${vm.ip}`,
              ...vm,
            },
            position: {
              x: serverX,
              y: currentY,
            },
            style: {
              background: "#fef2f2",
              color: "#0f0f0f",
              border: "2px solid #fecaca",
              borderRadius: "4px",
              padding: "6px",
              width: APP_NODE_WIDTH,
              height: APP_NODE_HEIGHT,
              fontSize: "0.8rem",
              lineHeight: "1.1",
              whiteSpace: "pre-wrap",
            },
          });

          // Dynamischer Abstand basierend auf Anzahl Apps
          const requiredSpace = appCount > 0 
            ? (appCount * (APP_NODE_HEIGHT + APP_ROW_SPACING))
            : 0;
            
          currentY += Math.max(
            requiredSpace + MIN_VM_SPACING,
            MIN_VM_SPACING + APP_NODE_HEIGHT
          );
        });
      }
    });

    // Level 4: VM Applications (right column)
    const vmAppNodes: Node[] = [];
    vmNodes.forEach((vm) => {
      const vmX = vm.position.x;
      applications
        .filter(app => app.serverId === vm.data.id)
        .forEach((app, appIndex) => {
          vmAppNodes.push({
            id: `vm-app-${app.id}`,
            type: "application",
            data: {
              label: `${app.name}\n${app.localURL}`,
              ...app,
            },
            position: {
              x: vmX + VM_APP_SPACING,
              y: vm.position.y + appIndex * (APP_NODE_HEIGHT + 20),
            },
            style: {
              background: "#f5f5f5",
              color: "#0f0f0f",
              border: "2px solid #e6e4e1",
              borderRadius: "4px",
              padding: "6px",
              width: APP_NODE_WIDTH,
              height: APP_NODE_HEIGHT,
              fontSize: "0.8rem",
              lineHeight: "1.1",
              whiteSpace: "pre-wrap",
            },
          });
        });
    });

    // Calculate dimensions for root node positioning
    const tempNodes = [...serverNodes, ...serviceNodes, ...vmNodes, ...vmAppNodes];
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    tempNodes.forEach((node) => {
      const width = parseInt(node.style.width?.toString() || "0", 10);
      const height = parseInt(node.style.height?.toString() || "0", 10);
      
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x + width);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y + height);
    });

    const centerX = (minX + maxX) / 2;
    const rootX = centerX - ROOT_NODE_WIDTH / 2;

    // Level 1: Root Node (centered at top)
    const rootNode: Node = {
      id: "root",
      type: "infrastructure",
      data: { label: "My Infrastructure" },
      position: { x: rootX, y: 0 },
      style: {
        background: "#ffffff",
        color: "#0f0f0f",
        border: "2px solid #e6e4e1",
        borderRadius: "8px",
        padding: "16px",
        width: ROOT_NODE_WIDTH,
        height: NODE_HEIGHT,
        fontSize: "1.2rem",
        fontWeight: "bold",
      },
    };

    // Update dimensions with root node
    const allNodes = [rootNode, ...tempNodes];
    let newMinX = Math.min(minX, rootNode.position.x);
    let newMaxX = Math.max(maxX, rootNode.position.x + ROOT_NODE_WIDTH);
    let newMinY = Math.min(minY, rootNode.position.y);
    let newMaxY = Math.max(maxY, rootNode.position.y + NODE_HEIGHT);

    // Container Node
    const containerNode: Node = {
      id: 'container',
      type: 'container',
      data: { label: '' },
      position: {
        x: newMinX - CONTAINER_PADDING,
        y: newMinY - CONTAINER_PADDING
      },
      style: {
        width: newMaxX - newMinX + 2 * CONTAINER_PADDING,
        height: newMaxY - newMinY + 2 * CONTAINER_PADDING,
        background: 'transparent',
        border: '2px dashed #e2e8f0',
        borderRadius: '8px',
        zIndex: 0,
      },
      draggable: false,
      selectable: false,
      zIndex: -1,
    };

    // Connections with hierarchical chaining
    const connections: Edge[] = [];

    // Root to Servers
    serverNodes.forEach((server) => {
      connections.push({
        id: `conn-root-${server.id}`,
        source: "root",
        target: server.id,
        type: "straight",
        style: {
          stroke: "#94a3b8",
          strokeWidth: 2,
        },
      });
    });

    // Services chaining
    const servicesByServer = new Map<number, Node[]>();
    serviceNodes.forEach(service => {
      const serverId = service.data.serverId;
      if (!servicesByServer.has(serverId)) servicesByServer.set(serverId, []);
      servicesByServer.get(serverId)!.push(service);
    });
    servicesByServer.forEach((services, serverId) => {
      services.sort((a, b) => a.position.y - b.position.y);
      services.forEach((service, index) => {
        if (index === 0) {
          connections.push({
            id: `conn-service-${service.id}`,
            source: `server-${serverId}`,
            target: service.id,
            type: "straight",
            style: { stroke: "#60a5fa", strokeWidth: 2 },
          });
        } else {
          const prevService = services[index - 1];
          connections.push({
            id: `conn-service-${service.id}-${prevService.id}`,
            source: prevService.id,
            target: service.id,
            type: "straight",
            style: { stroke: "#60a5fa", strokeWidth: 2 },
          });
        }
      });
    });

    // VMs chaining
    const vmsByHost = new Map<number, Node[]>();
    vmNodes.forEach(vm => {
      const hostId = vm.data.hostServer;
      if (!vmsByHost.has(hostId)) vmsByHost.set(hostId, []);
      vmsByHost.get(hostId)!.push(vm);
    });
    vmsByHost.forEach((vms, hostId) => {
      vms.sort((a, b) => a.position.y - b.position.y);
      vms.forEach((vm, index) => {
        if (index === 0) {
          connections.push({
            id: `conn-vm-${vm.id}`,
            source: `server-${hostId}`,
            target: vm.id,
            type: "straight",
            style: { stroke: "#f87171", strokeWidth: 2 },
          });
        } else {
          const prevVm = vms[index - 1];
          connections.push({
            id: `conn-vm-${vm.id}-${prevVm.id}`,
            source: prevVm.id,
            target: vm.id,
            type: "straight",
            style: { stroke: "#f87171", strokeWidth: 2 },
          });
        }
      });
    });

    // VM Applications chaining
    const appsByVM = new Map<number, Node[]>();
    vmAppNodes.forEach(app => {
      const vmId = app.data.serverId;
      if (!appsByVM.has(vmId)) appsByVM.set(vmId, []);
      appsByVM.get(vmId)!.push(app);
    });
    appsByVM.forEach((apps, vmId) => {
      apps.sort((a, b) => a.position.y - b.position.y);
      apps.forEach((app, index) => {
        if (index === 0) {
          connections.push({
            id: `conn-vm-app-${app.id}`,
            source: `vm-${vmId}`,
            target: app.id,
            type: "straight",
            style: { stroke: "#f87171", strokeWidth: 2 },
          });
        } else {
          const prevApp = apps[index - 1];
          connections.push({
            id: `conn-vm-app-${app.id}-${prevApp.id}`,
            source: prevApp.id,
            target: app.id,
            type: "straight",
            style: { stroke: "#f87171", strokeWidth: 2 },
          });
        }
      });
    });

    return NextResponse.json({
      nodes: [containerNode, ...allNodes],
      edges: connections,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        error: `Error fetching flowchart: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}