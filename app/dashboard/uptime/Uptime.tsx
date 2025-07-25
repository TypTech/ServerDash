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
import axios from "axios";
import { Card, CardHeader } from "@/components/ui/card";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
} from "@/components/ui/pagination";
import { useState, useEffect, useRef } from "react";
import Cookies from "js-cookie";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useTranslations } from "next-intl";

const timeFormats = {
  1: (timestamp: string) => 
    new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
  2: (timestamp: string) => 
    new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    }),
  3: (timestamp: string) => 
    new Date(timestamp).toLocaleDateString([], { 
      day: '2-digit', 
      month: 'short' 
    }),
  4: (timestamp: string) => 
    new Date(timestamp).toLocaleDateString([], { 
      day: '2-digit', 
      month: 'short' 
    })
};

const minBoxWidths = {
  1: 20,
  2: 20,
  3: 24,
  4: 24
};

interface UptimeData {
  appName: string;
  appId: number;
  uptimeSummary: {
    timestamp: string;
    missing: boolean;
    online: boolean | null;
  }[];
}

interface NetworkDeviceUptimeData {
  deviceName: string;
  deviceId: number;
  deviceType: string;
  uptimeSummary: {
    timestamp: string;
    missing: boolean;
    online: boolean | null;
  }[];
}

interface ServerUptimeData {
  serverName: string;
  serverId: number;
  serverType: string;
  uptimeSummary: {
    timestamp: string;
    missing: boolean;
    online: boolean | null;
  }[];
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function Uptime() {
  const t = useTranslations();
  const [data, setData] = useState<UptimeData[]>([]);
  const [networkData, setNetworkData] = useState<NetworkDeviceUptimeData[]>([]);
  const [serverData, setServerData] = useState<ServerUptimeData[]>([]);
  const [timespan, setTimespan] = useState<1 | 2 | 3 | 4>(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [networkPagination, setNetworkPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [serverPagination, setServerPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isNetworkLoading, setIsNetworkLoading] = useState(false);
  const [isServerLoading, setIsServerLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [nextRefreshIn, setNextRefreshIn] = useState<number>(60);
  
  const savedItemsPerPage = Cookies.get("itemsPerPage-uptime");
  const defaultItemsPerPage = 5;
  const initialItemsPerPage = savedItemsPerPage ? parseInt(savedItemsPerPage) : defaultItemsPerPage;
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);
  const customInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getData = async (selectedTimespan: number, page: number, itemsPerPage: number, updateTimestamp: boolean = true) => {
    setIsLoading(true);
    try {
      const response = await axios.post<{
        data: UptimeData[];
        pagination: PaginationData;
      }>("/api/applications/uptime", { 
        timespan: selectedTimespan,
        page,
        itemsPerPage
      });
      
      setData(response.data.data);
      setPagination(response.data.pagination);
      
      if (updateTimestamp) {
        setLastUpdated(new Date());
        setNextRefreshIn(60);
      }
    } catch (error) {
      console.error("Error:", error);
      setData([]);
      setPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getNetworkData = async (selectedTimespan: number, page: number, itemsPerPage: number, updateTimestamp: boolean = true) => {
    setIsNetworkLoading(true);
    try {
      const response = await axios.post<{
        data: NetworkDeviceUptimeData[];
        pagination: PaginationData;
      }>("/api/network-devices/uptime", { 
        timespan: selectedTimespan,
        page,
        itemsPerPage
      });
      
      setNetworkData(response.data.data);
      setNetworkPagination(response.data.pagination);
    } catch (error) {
      console.error("Network devices uptime error:", error);
      setNetworkData([]);
      setNetworkPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
    } finally {
      setIsNetworkLoading(false);
    }
  };

  const getServerData = async (selectedTimespan: number, page: number, itemsPerPage: number, updateTimestamp: boolean = true) => {
    setIsServerLoading(true);
    try {
      const response = await axios.post<{
        data: ServerUptimeData[];
        pagination: PaginationData;
      }>("/api/servers/uptime", { 
        timespan: selectedTimespan,
        page,
        itemsPerPage
      });
      
      setServerData(response.data.data);
      setServerPagination(response.data.pagination);
    } catch (error) {
      console.error("Servers uptime error:", error);
      setServerData([]);
      setServerPagination({
        currentPage: 1,
        totalPages: 1,
        totalItems: 0
      });
    } finally {
      setIsServerLoading(false);
    }
  };

  const handlePrevious = () => {
    const newPage = Math.max(1, pagination.currentPage - 1);
    setPagination(prev => ({...prev, currentPage: newPage}));
    getData(timespan, newPage, itemsPerPage);
    setNextRefreshIn(60); // Reset countdown on manual action
  };

  const handleNext = () => {
    const newPage = Math.min(pagination.totalPages, pagination.currentPage + 1);
    setPagination(prev => ({...prev, currentPage: newPage}));
    getData(timespan, newPage, itemsPerPage);
    setNextRefreshIn(60); // Reset countdown on manual action
  };

  const handleNetworkPrevious = () => {
    const newPage = Math.max(1, networkPagination.currentPage - 1);
    setNetworkPagination(prev => ({...prev, currentPage: newPage}));
    getNetworkData(timespan, newPage, itemsPerPage);
    setNextRefreshIn(60); // Reset countdown on manual action
  };

  const handleNetworkNext = () => {
    const newPage = Math.min(networkPagination.totalPages, networkPagination.currentPage + 1);
    setNetworkPagination(prev => ({...prev, currentPage: newPage}));
    getNetworkData(timespan, newPage, itemsPerPage);
    setNextRefreshIn(60); // Reset countdown on manual action
  };

  const handleServerPrevious = () => {
    const newPage = Math.max(1, serverPagination.currentPage - 1);
    setServerPagination(prev => ({...prev, currentPage: newPage}));
    getServerData(timespan, newPage, itemsPerPage);
    setNextRefreshIn(60); // Reset countdown on manual action
  };

  const handleServerNext = () => {
    const newPage = Math.min(serverPagination.totalPages, serverPagination.currentPage + 1);
    setServerPagination(prev => ({...prev, currentPage: newPage}));
    getServerData(timespan, newPage, itemsPerPage);
    setNextRefreshIn(60); // Reset countdown on manual action
  };

  const handleItemsPerPageChange = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const newItemsPerPage = parseInt(value);
      
      if (isNaN(newItemsPerPage) || newItemsPerPage < 1) {
        toast.error(t('Uptime.Messages.NumberValidation'));
        return;
      }
      
      const validatedValue = Math.min(Math.max(newItemsPerPage, 1), 100);
      
      setItemsPerPage(validatedValue);
      setPagination(prev => ({...prev, currentPage: 1}));
      setNetworkPagination(prev => ({...prev, currentPage: 1}));
      setServerPagination(prev => ({...prev, currentPage: 1}));
      Cookies.set("itemsPerPage-uptime", String(validatedValue), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
      
      getData(timespan, 1, validatedValue);
      getNetworkData(timespan, 1, validatedValue);
      getServerData(timespan, 1, validatedValue);
      setNextRefreshIn(60); // Reset countdown on manual action
    }, 300);
  };

  // Auto-refresh functionality
  useEffect(() => {
    // Initial data load
    getData(timespan, pagination.currentPage, itemsPerPage);
    getNetworkData(timespan, networkPagination.currentPage, itemsPerPage);
    getServerData(timespan, serverPagination.currentPage, itemsPerPage);

    // Set up auto-refresh every 60 seconds (1 minute)
    const refreshInterval = setInterval(() => {
      getData(timespan, pagination.currentPage, itemsPerPage);
      getNetworkData(timespan, networkPagination.currentPage, itemsPerPage);
      getServerData(timespan, serverPagination.currentPage, itemsPerPage);
    }, 60000); // 60 seconds

    // Cleanup interval on component unmount or when timespan changes
    return () => {
      clearInterval(refreshInterval);
    };
  }, [timespan]);

  // Countdown timer effect
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setNextRefreshIn((prev) => {
        if (prev <= 1) {
          return 60; // Reset to 60 when it reaches 0
        }
        return prev - 1;
      });
    }, 1000); // Update every second

    return () => {
      clearInterval(countdownInterval);
    };
  }, []);

  // Separate effect for pagination changes (don't update timestamp for pagination)
  useEffect(() => {
    getData(timespan, pagination.currentPage, itemsPerPage, false);
  }, [pagination.currentPage]);

  useEffect(() => {
    getNetworkData(timespan, networkPagination.currentPage, itemsPerPage, false);
  }, [networkPagination.currentPage]);

  useEffect(() => {
    getServerData(timespan, serverPagination.currentPage, itemsPerPage, false);
  }, [serverPagination.currentPage]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage>/</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('Uptime.Breadcrumb.MyInfrastructure')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('Uptime.Breadcrumb.Uptime')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Toaster />
        <div className="p-6">
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-3xl font-bold">{t('Uptime.Title')}</span>
              {lastUpdated && (
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>
                    Last updated: {lastUpdated.toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      second: '2-digit',
                      hour12: false 
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Next refresh in {nextRefreshIn}s
                  </span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  getData(timespan, pagination.currentPage, itemsPerPage);
                  getNetworkData(timespan, networkPagination.currentPage, itemsPerPage);
                  getServerData(timespan, serverPagination.currentPage, itemsPerPage);
                  setNextRefreshIn(60);
                }}
                disabled={isLoading || isNetworkLoading || isServerLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Refresh data manually"
              >
                <svg 
                  className={`w-4 h-4 ${(isLoading || isNetworkLoading || isServerLoading) ? 'animate-spin' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
              <Select
                value={String(itemsPerPage)}
                onValueChange={handleItemsPerPageChange}
                onOpenChange={(open) => {
                  if (open && customInputRef.current) {
                    customInputRef.current.value = String(itemsPerPage);
                  }
                }}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue>
                    {itemsPerPage} {itemsPerPage === 1 ? t('Common.ItemsPerPage.item') : t('Common.ItemsPerPage.items')}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {![5, 10, 15, 20, 25].includes(itemsPerPage) ? (
                    <SelectItem value={String(itemsPerPage)}>
                      {itemsPerPage} {itemsPerPage === 1 ? t('Common.ItemsPerPage.item') : t('Common.ItemsPerPage.items')} (custom)
                    </SelectItem>
                  ) : null}
                  <SelectItem value="5">{t('Common.ItemsPerPage.5')}</SelectItem>
                  <SelectItem value="10">{t('Common.ItemsPerPage.10')}</SelectItem>
                  <SelectItem value="15">{t('Common.ItemsPerPage.15')}</SelectItem>
                  <SelectItem value="20">{t('Common.ItemsPerPage.20')}</SelectItem>
                  <SelectItem value="25">{t('Common.ItemsPerPage.25')}</SelectItem>
                  <div className="p-2 border-t mt-1">
                    <Label htmlFor="custom-items" className="text-xs font-medium">{t('Common.ItemsPerPage.Custom')}</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        id="custom-items"
                        ref={customInputRef}
                        type="number"
                        min="1"
                        max="100"
                        className="h-8"
                        defaultValue={itemsPerPage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value < 1 || value > 100) {
                            e.target.classList.add("border-red-500");
                          } else {
                            e.target.classList.remove("border-red-500");
                          }
                        }}
                        onBlur={(e) => {
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleItemsPerPageChange(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (debounceTimerRef.current) {
                              clearTimeout(debounceTimerRef.current);
                              debounceTimerRef.current = null;
                            }
                            
                            const value = parseInt((e.target as HTMLInputElement).value);
                            if (value >= 1 && value <= 100) {
                              const validatedValue = Math.min(Math.max(value, 1), 100);
                              setItemsPerPage(validatedValue);
                              setPagination(prev => ({...prev, currentPage: 1}));
                              setNetworkPagination(prev => ({...prev, currentPage: 1}));
                              Cookies.set("itemsPerPage-uptime", String(validatedValue), {
                                expires: 365,
                                path: "/",
                                sameSite: "strict",
                                                          });
                            getData(timespan, 1, validatedValue);
                            getNetworkData(timespan, 1, validatedValue);
                            getServerData(timespan, 1, validatedValue);
                            setNextRefreshIn(60); // Reset countdown on manual action
                            document.body.click();
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{t('Common.ItemsPerPage.items')}</span>
                    </div>
                  </div>
                </SelectContent>
              </Select>
              <Select 
                value={String(timespan)} 
                onValueChange={(v) => {
                  setTimespan(Number(v) as 1 | 2 | 3 | 4);
                  setPagination(prev => ({...prev, currentPage: 1}));
                  setNetworkPagination(prev => ({...prev, currentPage: 1}));
                  setServerPagination(prev => ({...prev, currentPage: 1}));
                  setNextRefreshIn(60); // Reset countdown on manual action
                }}
                disabled={isLoading || isNetworkLoading || isServerLoading}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder={t('Uptime.TimeRange.Select')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">{t('Uptime.TimeRange.LastHour')}</SelectItem>
                  <SelectItem value="2">{t('Uptime.TimeRange.LastDay')}</SelectItem>
                  <SelectItem value="3">{t('Uptime.TimeRange.Last7Days')}</SelectItem>
                  <SelectItem value="4">{t('Uptime.TimeRange.Last30Days')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Servers Section */}
          {isServerLoading ? (
            <div className="pt-4 space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Servers</h2>
              <div className="text-center py-8">{t('Uptime.Messages.Loading')}</div>
            </div>
          ) : serverData.length === 0 ? (
            <div className="pt-4 space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Servers</h2>
              <div className="text-center py-8 text-muted-foreground">No servers found</div>
            </div>
          ) : (
            // Filter and show only Physical Hosts and other non-VM servers
            (() => {
              const physicalServers = serverData.filter(server => server.serverType !== 'Virtual Machine');
              
              if (physicalServers.length === 0) {
                return (
                  <div className="pt-4 space-y-4">
                    <h2 className="text-xl font-semibold text-foreground/80">Servers</h2>
                    <div className="text-center py-8 text-muted-foreground">No physical servers found</div>
                  </div>
                );
              }

              const serversByType = physicalServers.reduce((acc, server) => {
                const type = server.serverType;
                if (!acc[type]) {
                  acc[type] = [];
                }
                acc[type].push(server);
                return acc;
              }, {} as Record<string, typeof serverData>);

              const getTypeIcon = (type: string) => {
                const typeIcons: Record<string, string> = {
                  'Physical Host': '🖥️',
                  'Server': '🌐'
                };
                return typeIcons[type] || '🖥️';
              };

              return (
                <div className="pt-4 space-y-4">
                  {Object.entries(serversByType).map(([serverType, servers]) => (
                    <div key={serverType} className="space-y-4">
                      <h2 className="text-xl font-semibold text-foreground/80 flex items-center gap-2">
                        <span>{getTypeIcon(serverType)}</span>
                        {serverType === 'Physical Host' ? 'Servers' : serverType}
                        <span className="text-sm text-muted-foreground font-normal">({servers.length})</span>
                      </h2>
                      {servers.map((server) => {
                        const reversedSummary = [...server.uptimeSummary].reverse();
                        const startTime = reversedSummary[0]?.timestamp;
                        const endTime = reversedSummary[reversedSummary.length - 1]?.timestamp;

                        return (
                          <Card key={server.serverId}>
                            <CardHeader>
                              <div className="flex flex-col gap-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold">{server.serverName}</span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    {server.serverType.toUpperCase()}
                                  </span>
                                </div>
                                
                                <div className="flex flex-col gap-2">
                                  <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{startTime ? timeFormats[timespan](startTime) : ""}</span>
                                    <span>{endTime ? timeFormats[timespan](endTime) : ""}</span>
                                  </div>
                                  
                                  <Tooltip.Provider>
                                    <div 
                                      className="grid gap-0.5 w-full pb-2"
                                      style={{ 
                                        gridTemplateColumns: `repeat(auto-fit, minmax(${minBoxWidths[timespan]}px, 1fr))`
                                      }}
                                    >
                                      {reversedSummary.map((entry) => (
                                        <Tooltip.Root key={entry.timestamp}>
                                          <Tooltip.Trigger asChild>
                                            <div
                                              className={`h-8 w-full rounded-sm border transition-colors ${
                                                entry.missing
                                                  ? "bg-gray-300 border-gray-400"
                                                  : entry.online
                                                  ? "bg-green-500 border-green-600"
                                                  : "bg-red-500 border-red-600"
                                              }`}
                                            />
                                          </Tooltip.Trigger>
                                          <Tooltip.Portal>
                                            <Tooltip.Content
                                              className="rounded bg-gray-900 px-2 py-1 text-white text-xs shadow-lg"
                                              side="top"
                                            >
                                              <div className="flex flex-col gap-1">
                                                <p className="font-medium">
                                                  {new Date(entry.timestamp).toLocaleString([], {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: timespan > 2 ? 'numeric' : undefined,
                                                    hour: '2-digit',
                                                    minute: timespan === 1 ? '2-digit' : undefined,
                                                    hour12: false
                                                  })}
                                                </p>
                                                <p>
                                                  {entry.missing
                                                    ? t('Uptime.Status.NoData')
                                                    : entry.online
                                                    ? t('Uptime.Status.Online')
                                                    : t('Uptime.Status.Offline')}
                                                </p>
                                              </div>
                                              <Tooltip.Arrow className="fill-gray-900" />
                                            </Tooltip.Content>
                                          </Tooltip.Portal>
                                        </Tooltip.Root>
                                      ))}
                                    </div>
                                  </Tooltip.Provider>
                                </div>
                              </div>
                            </CardHeader>
                          </Card>
                        );
                      })}
                    </div>
                  ))}
                </div>
              );
            })()
          )}

          {/* Virtual Machines Section */}
          {isServerLoading ? (
            <div className="pt-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Virtual Machines</h2>
              <div className="text-center py-8">{t('Uptime.Messages.Loading')}</div>
            </div>
          ) : (
            // Filter and show only Virtual Machines
            (() => {
              const virtualMachines = serverData.filter(server => server.serverType === 'Virtual Machine');
              
              if (virtualMachines.length === 0) {
                return (
                  <div className="pt-8 space-y-4">
                    <h2 className="text-xl font-semibold text-foreground/80">Virtual Machines</h2>
                    <div className="text-center py-8 text-muted-foreground">No virtual machines found</div>
                  </div>
                );
              }

              return (
                <div className="pt-8 space-y-4">
                  <h2 className="text-xl font-semibold text-foreground/80 flex items-center gap-2">
                    <span>💻</span>
                    Virtual Machines
                    <span className="text-sm text-muted-foreground font-normal">({virtualMachines.length})</span>
                  </h2>
                  {virtualMachines.map((server) => {
                    const reversedSummary = [...server.uptimeSummary].reverse();
                    const startTime = reversedSummary[0]?.timestamp;
                    const endTime = reversedSummary[reversedSummary.length - 1]?.timestamp;

                    return (
                      <Card key={server.serverId}>
                        <CardHeader>
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">{server.serverName}</span>
                              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                                VIRTUAL MACHINE
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{startTime ? timeFormats[timespan](startTime) : ""}</span>
                                <span>{endTime ? timeFormats[timespan](endTime) : ""}</span>
                              </div>
                              
                              <Tooltip.Provider>
                                <div 
                                  className="grid gap-0.5 w-full pb-2"
                                  style={{ 
                                    gridTemplateColumns: `repeat(auto-fit, minmax(${minBoxWidths[timespan]}px, 1fr))`
                                  }}
                                >
                                  {reversedSummary.map((entry) => (
                                    <Tooltip.Root key={entry.timestamp}>
                                      <Tooltip.Trigger asChild>
                                        <div
                                          className={`h-8 w-full rounded-sm border transition-colors ${
                                            entry.missing
                                              ? "bg-gray-300 border-gray-400"
                                              : entry.online
                                              ? "bg-green-500 border-green-600"
                                              : "bg-red-500 border-red-600"
                                          }`}
                                        />
                                      </Tooltip.Trigger>
                                      <Tooltip.Portal>
                                        <Tooltip.Content
                                          className="rounded bg-gray-900 px-2 py-1 text-white text-xs shadow-lg"
                                          side="top"
                                        >
                                          <div className="flex flex-col gap-1">
                                            <p className="font-medium">
                                              {new Date(entry.timestamp).toLocaleString([], {
                                                year: 'numeric',
                                                month: 'short',
                                                day: timespan > 2 ? 'numeric' : undefined,
                                                hour: '2-digit',
                                                minute: timespan === 1 ? '2-digit' : undefined,
                                                hour12: false
                                              })}
                                            </p>
                                            <p>
                                              {entry.missing
                                                ? t('Uptime.Status.NoData')
                                                : entry.online
                                                ? t('Uptime.Status.Online')
                                                : t('Uptime.Status.Offline')}
                                            </p>
                                          </div>
                                          <Tooltip.Arrow className="fill-gray-900" />
                                        </Tooltip.Content>
                                      </Tooltip.Portal>
                                    </Tooltip.Root>
                                  ))}
                                </div>
                              </Tooltip.Provider>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              );
            })()
          )}

          {/* Network Devices Sections by Type */}
          {isNetworkLoading ? (
            <div className="pt-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Network Devices</h2>
              <div className="text-center py-8">{t('Uptime.Messages.Loading')}</div>
            </div>
          ) : networkData.length === 0 ? (
            <div className="pt-8 space-y-4">
              <h2 className="text-xl font-semibold text-foreground/80">Network Devices</h2>
              <div className="text-center py-8 text-muted-foreground">No network devices found</div>
            </div>
          ) : (
            // Group devices by type and create sections
            (() => {
              const devicesByType = networkData.reduce((acc, device) => {
                const type = device.deviceType;
                if (!acc[type]) {
                  acc[type] = [];
                }
                acc[type].push(device);
                return acc;
              }, {} as Record<string, typeof networkData>);

              const getTypeDisplayName = (type: string) => {
                const typeNames: Record<string, string> = {
                  'switch': 'Network Switches',
                  'access-point': 'Access Points',
                  'router': 'Routers',
                  'firewall': 'Firewalls',
                  'repeater': 'Repeaters',
                  'other': 'Other Network Devices'
                };
                return typeNames[type] || `${type.charAt(0).toUpperCase() + type.slice(1)} Devices`;
              };

              const getTypeIcon = (type: string) => {
                const typeIcons: Record<string, string> = {
                  'switch': '🔀',
                  'access-point': '📶',
                  'router': '🌐',
                  'firewall': '🛡️',
                  'repeater': '📡',
                  'other': '🔧'
                };
                return typeIcons[type] || '🔧';
              };

              return Object.entries(devicesByType).map(([deviceType, devices]) => (
                <div key={deviceType} className="pt-8 space-y-4">
                  <h2 className="text-xl font-semibold text-foreground/80 flex items-center gap-2">
                    <span>{getTypeIcon(deviceType)}</span>
                    {getTypeDisplayName(deviceType)}
                    <span className="text-sm text-muted-foreground font-normal">({devices.length})</span>
                  </h2>
                  {devices.map((device) => {
                    const reversedSummary = [...device.uptimeSummary].reverse();
                    const startTime = reversedSummary[0]?.timestamp;
                    const endTime = reversedSummary[reversedSummary.length - 1]?.timestamp;

                    return (
                      <Card key={device.deviceId}>
                        <CardHeader>
                          <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center">
                              <span className="text-lg font-semibold">{device.deviceName}</span>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                {device.deviceType.toUpperCase()}
                              </span>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{startTime ? timeFormats[timespan](startTime) : ""}</span>
                                <span>{endTime ? timeFormats[timespan](endTime) : ""}</span>
                              </div>
                              
                              <Tooltip.Provider>
                                <div 
                                  className="grid gap-0.5 w-full pb-2"
                                  style={{ 
                                    gridTemplateColumns: `repeat(auto-fit, minmax(${minBoxWidths[timespan]}px, 1fr))`
                                  }}
                                >
                                  {reversedSummary.map((entry) => (
                                    <Tooltip.Root key={entry.timestamp}>
                                      <Tooltip.Trigger asChild>
                                        <div
                                          className={`h-8 w-full rounded-sm border transition-colors ${
                                            entry.missing
                                              ? "bg-gray-300 border-gray-400"
                                              : entry.online
                                              ? "bg-green-500 border-green-600"
                                              : "bg-red-500 border-red-600"
                                          }`}
                                        />
                                      </Tooltip.Trigger>
                                      <Tooltip.Portal>
                                        <Tooltip.Content
                                          className="rounded bg-gray-900 px-2 py-1 text-white text-xs shadow-lg"
                                          side="top"
                                        >
                                          <div className="flex flex-col gap-1">
                                            <p className="font-medium">
                                              {new Date(entry.timestamp).toLocaleString([], {
                                                year: 'numeric',
                                                month: 'short',
                                                day: timespan > 2 ? 'numeric' : undefined,
                                                hour: '2-digit',
                                                minute: timespan === 1 ? '2-digit' : undefined,
                                                hour12: false
                                              })}
                                            </p>
                                            <p>
                                              {entry.missing
                                                ? t('Uptime.Status.NoData')
                                                : entry.online
                                                ? t('Uptime.Status.Online')
                                                : t('Uptime.Status.Offline')}
                                            </p>
                                          </div>
                                          <Tooltip.Arrow className="fill-gray-900" />
                                        </Tooltip.Content>
                                      </Tooltip.Portal>
                                    </Tooltip.Root>
                                  ))}
                                </div>
                              </Tooltip.Provider>
                            </div>
                          </div>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              ));
            })()
          )}

          {/* Applications Section */}
          <div className="pt-8 space-y-4">
            <h2 className="text-xl font-semibold text-foreground/80">Applications</h2>
            {isLoading ? (
              <div className="text-center py-8">{t('Uptime.Messages.Loading')}</div>
            ) : data.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No applications found</div>
            ) : (
              data.map((app) => {
                const reversedSummary = [...app.uptimeSummary].reverse();
                const startTime = reversedSummary[0]?.timestamp;
                const endTime = reversedSummary[reversedSummary.length - 1]?.timestamp;

                return (
                  <Card key={app.appId}>
                    <CardHeader>
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-semibold">{app.appName}</span>
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{startTime ? timeFormats[timespan](startTime) : ""}</span>
                            <span>{endTime ? timeFormats[timespan](endTime) : ""}</span>
                          </div>
                          
                          <Tooltip.Provider>
                            <div 
                              className="grid gap-0.5 w-full pb-2"
                              style={{ 
                                gridTemplateColumns: `repeat(auto-fit, minmax(${minBoxWidths[timespan]}px, 1fr))`
                              }}
                            >
                              {reversedSummary.map((entry) => (
                                <Tooltip.Root key={entry.timestamp}>
                                  <Tooltip.Trigger asChild>
                                    <div
                                      className={`h-8 w-full rounded-sm border transition-colors ${
                                        entry.missing
                                          ? "bg-gray-300 border-gray-400"
                                          : entry.online
                                          ? "bg-green-500 border-green-600"
                                          : "bg-red-500 border-red-600"
                                      }`}
                                    />
                                  </Tooltip.Trigger>
                                  <Tooltip.Portal>
                                    <Tooltip.Content
                                      className="rounded bg-gray-900 px-2 py-1 text-white text-xs shadow-lg"
                                      side="top"
                                    >
                                      <div className="flex flex-col gap-1">
                                        <p className="font-medium">
                                          {new Date(entry.timestamp).toLocaleString([], {
                                            year: 'numeric',
                                            month: 'short',
                                            day: timespan > 2 ? 'numeric' : undefined,
                                            hour: '2-digit',
                                            minute: timespan === 1 ? '2-digit' : undefined,
                                            hour12: false
                                          })}
                                        </p>
                                        <p>
                                          {entry.missing
                                            ? t('Uptime.Status.NoData')
                                            : entry.online
                                            ? t('Uptime.Status.Online')
                                            : t('Uptime.Status.Offline')}
                                        </p>
                                      </div>
                                      <Tooltip.Arrow className="fill-gray-900" />
                                    </Tooltip.Content>
                                  </Tooltip.Portal>
                                </Tooltip.Root>
                              ))}
                            </div>
                          </Tooltip.Provider>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })
            )}
          </div>

          {/* Applications Pagination */}
          {pagination.totalItems > 0 && !isLoading && (
            <div className="pt-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Applications: </span>
                  {pagination.totalItems > 0 
                    ? t('Uptime.Pagination.Showing', { 
                        start: ((pagination.currentPage - 1) * itemsPerPage) + 1, 
                        end: Math.min(pagination.currentPage * itemsPerPage, pagination.totalItems), 
                        total: pagination.totalItems 
                      })
                    : t('Uptime.Messages.NoItems')}
                </div>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={handlePrevious}
                      aria-disabled={pagination.currentPage === 1 || isLoading}
                      className={
                        pagination.currentPage === 1 || isLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{pagination.currentPage}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={handleNext}
                      aria-disabled={pagination.currentPage === pagination.totalPages || isLoading}
                      className={
                        pagination.currentPage === pagination.totalPages || isLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Network Devices Pagination */}
          {networkPagination.totalItems > 0 && !isNetworkLoading && (
            <div className="pt-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Network Devices: </span>
                  {networkPagination.totalItems > 0 
                    ? t('Uptime.Pagination.Showing', { 
                        start: ((networkPagination.currentPage - 1) * itemsPerPage) + 1, 
                        end: Math.min(networkPagination.currentPage * itemsPerPage, networkPagination.totalItems), 
                        total: networkPagination.totalItems 
                      })
                    : t('Uptime.Messages.NoItems')}
                </div>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={handleNetworkPrevious}
                      aria-disabled={networkPagination.currentPage === 1 || isNetworkLoading}
                      className={
                        networkPagination.currentPage === 1 || isNetworkLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{networkPagination.currentPage}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={handleNetworkNext}
                      aria-disabled={networkPagination.currentPage === networkPagination.totalPages || isNetworkLoading}
                      className={
                        networkPagination.currentPage === networkPagination.totalPages || isNetworkLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}

          {/* Servers Pagination */}
          {serverPagination.totalItems > 0 && !isServerLoading && (
            <div className="pt-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Servers: </span>
                  {serverPagination.totalItems > 0 
                    ? t('Uptime.Pagination.Showing', { 
                        start: ((serverPagination.currentPage - 1) * itemsPerPage) + 1, 
                        end: Math.min(serverPagination.currentPage * itemsPerPage, serverPagination.totalItems), 
                        total: serverPagination.totalItems 
                      })
                    : t('Uptime.Messages.NoItems')}
                </div>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={handleServerPrevious}
                      aria-disabled={serverPagination.currentPage === 1 || isServerLoading}
                      className={
                        serverPagination.currentPage === 1 || isServerLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationLink isActive>{serverPagination.currentPage}</PaginationLink>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      onClick={handleServerNext}
                      aria-disabled={serverPagination.currentPage === serverPagination.totalPages || isServerLoading}
                      className={
                        serverPagination.currentPage === serverPagination.totalPages || isServerLoading 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}