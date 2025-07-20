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

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export default function Uptime() {
  const t = useTranslations();
  const [data, setData] = useState<UptimeData[]>([]);
  const [timespan, setTimespan] = useState<1 | 2 | 3 | 4>(1);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const savedItemsPerPage = Cookies.get("itemsPerPage-uptime");
  const defaultItemsPerPage = 5;
  const initialItemsPerPage = savedItemsPerPage ? parseInt(savedItemsPerPage) : defaultItemsPerPage;
  
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);
  const customInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const getData = async (selectedTimespan: number, page: number, itemsPerPage: number) => {
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

  const handlePrevious = () => {
    const newPage = Math.max(1, pagination.currentPage - 1);
    setPagination(prev => ({...prev, currentPage: newPage}));
    getData(timespan, newPage, itemsPerPage);
  };

  const handleNext = () => {
    const newPage = Math.min(pagination.totalPages, pagination.currentPage + 1);
    setPagination(prev => ({...prev, currentPage: newPage}));
    getData(timespan, newPage, itemsPerPage);
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
      Cookies.set("itemsPerPage-uptime", String(validatedValue), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
      
      getData(timespan, 1, validatedValue);
    }, 300);
  };

  useEffect(() => {
    getData(timespan, 1, itemsPerPage);
  }, [timespan]);

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
            <span className="text-3xl font-bold">{t('Uptime.Title')}</span>
            <div className="flex gap-2">
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
                              Cookies.set("itemsPerPage-uptime", String(validatedValue), {
                                expires: 365,
                                path: "/",
                                sameSite: "strict",
                              });
                              getData(timespan, 1, validatedValue);
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
                }}
                disabled={isLoading}
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

          <div className="pt-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8">{t('Uptime.Messages.Loading')}</div>
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

          {pagination.totalItems > 0 && !isLoading && (
            <div className="pt-4 pb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm text-muted-foreground">
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
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}