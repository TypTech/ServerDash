import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ReactFlow, Controls, Background, ConnectionLineType } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

export default function Dashboard() {
  const t = useTranslations();
  const [nodes, setNodes] = useState<any[]>([]);
  const [edges, setEdges] = useState<any[]>([]);

  useEffect(() => {
    const fetchFlowData = async () => {
      try {
        const response = await fetch("/api/flowchart");
        const data = await response.json();

        setNodes(data.nodes);
        setEdges(data.edges);
      } catch (error) {
        console.error("Error loading flowchart:", error);
      }
    };

    fetchFlowData();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1 dark:text-white" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 dark:bg-slate-700"
            />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage className="dark:text-slate-300">
                    /
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block dark:text-slate-500" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="dark:text-slate-300">
                    {t('Network.Breadcrumb.MyInfrastructure')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block dark:text-slate-500" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="dark:text-slate-300">
                    {t('Network.Breadcrumb.Network')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex-1 pl-4 pr-4">
          <div
            style={{ height: "100%" }}
            className="dark:bg-black rounded-lg"
          >
            <ReactFlow
                nodes={nodes}
                edges={edges}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                connectionLineType={ConnectionLineType.Straight}
                className="dark:[&_.react-flow__edge-path]:stroke-slate-500"
            >
              <Background
                color="#64748b"
                gap={40}
                className="dark:opacity-20"
              />
            </ReactFlow>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
