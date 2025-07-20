"use client";

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
import { Button } from "@/components/ui/button";
import {
  Plus,
  Link,
  Home,
  Trash2,
  LayoutGrid,
  List,
  Pencil,
  Zap,
  ViewIcon,
  Grid3X3,
  HelpCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Cookies from "js-cookie";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { StatusIndicator } from "@/components/status-indicator";
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslations } from "next-intl";

interface Application {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  publicURL: string;
  localURL?: string;
  server?: string;
  online: boolean;
  serverId: number;
  uptimecheckUrl?: string;
}

interface Server {
  id: number;
  name: string;
}

interface ApplicationsResponse {
  applications: Application[];
  servers: Server[];
  maxPage: number;
  totalItems?: number;
}

export default function Dashboard() {
  const t = useTranslations();
  const [name, setName] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [icon, setIcon] = useState<string>("");
  const [publicURL, setPublicURL] = useState<string>("");
  const [localURL, setLocalURL] = useState<string>("");
  const [serverId, setServerId] = useState<number | null>(null);
  const [customUptimeCheck, setCustomUptimeCheck] = useState<boolean>(false);
  const [uptimecheckUrl, setUptimecheckUrl] = useState<string>("");

  const [editName, setEditName] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editIcon, setEditIcon] = useState<string>("");
  const [editPublicURL, setEditPublicURL] = useState<string>("");
  const [editLocalURL, setEditLocalURL] = useState<string>("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editServerId, setEditServerId] = useState<number | null>(null);
  const [editCustomUptimeCheck, setEditCustomUptimeCheck] = useState<boolean>(false);
  const [editUptimecheckUrl, setEditUptimecheckUrl] = useState<string>("");

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [maxPage, setMaxPage] = useState<number>(1);
  const [applications, setApplications] = useState<Application[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const savedLayout = Cookies.get("layoutPreference-app");
  const savedItemsPerPage = Cookies.get("itemsPerPage-app");
  const initialIsGridLayout = savedLayout === "grid";
  const initialIsCompactLayout = savedLayout === "compact";
  const defaultItemsPerPage = initialIsGridLayout ? 15 : (initialIsCompactLayout ? 30 : 5);
  const initialItemsPerPage = savedItemsPerPage ? parseInt(savedItemsPerPage) : defaultItemsPerPage;

  const [isGridLayout, setIsGridLayout] = useState<boolean>(initialIsGridLayout);
  const [isCompactLayout, setIsCompactLayout] = useState<boolean>(initialIsCompactLayout);
  const [itemsPerPage, setItemsPerPage] = useState<number>(initialItemsPerPage);
  const customInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const toggleLayout = (layout: string) => {
    if (layout === "standard") {
      setIsGridLayout(false);
      setIsCompactLayout(false);
      Cookies.set("layoutPreference-app", "standard", {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
    } else if (layout === "grid") {
      setIsGridLayout(true);
      setIsCompactLayout(false);
      Cookies.set("layoutPreference-app", "grid", {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
    } else if (layout === "compact") {
      setIsGridLayout(false);
      setIsCompactLayout(true);
      Cookies.set("layoutPreference-app", "compact", {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const newItemsPerPage = parseInt(value);
      
      if (isNaN(newItemsPerPage) || newItemsPerPage < 1) {
        toast.error(t('Applications.Messages.NumberValidation'));
        return;
      }
      
      const validatedValue = Math.min(Math.max(newItemsPerPage, 1), 100);
      
      setItemsPerPage(validatedValue);
      setCurrentPage(1);
      Cookies.set("itemsPerPage-app", String(validatedValue), {
        expires: 365,
        path: "/",
        sameSite: "strict",
      });
    }, 300);
  };

  const add = async () => {
    try {
      await axios.post("/api/applications/add", {
        name,
        description,
        icon,
        publicURL,
        localURL,
        serverId,
        uptimecheckUrl: customUptimeCheck ? uptimecheckUrl : "",
      });
      getApplications();
      toast.success(t('Applications.Messages.AddSuccess'));
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Applications.Messages.AddError'));
    }
  };

  const getApplications = async () => {
    try {
      setLoading(true);
      const response = await axios.post<ApplicationsResponse>(
        "/api/applications/get",
        { page: currentPage, ITEMS_PER_PAGE: itemsPerPage }
      );
      setApplications(response.data.applications);
      setServers(response.data.servers);
      setMaxPage(response.data.maxPage);
      if (response.data.totalItems !== undefined) {
        setTotalItems(response.data.totalItems);
      }
      setLoading(false);
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Applications.Messages.GetError'));
    }
  };

  // Calculate current range of items being displayed
  const [totalItems, setTotalItems] = useState<number>(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  useEffect(() => {
    getApplications();
  }, [currentPage, itemsPerPage]);

  const handlePrevious = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(maxPage, prev + 1));

  const deleteApplication = async (id: number) => {
    try {
      await axios.post("/api/applications/delete", { id });
      getApplications();
      toast.success(t('Applications.Messages.DeleteSuccess'));
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Applications.Messages.DeleteError'));
    }
  };

  const openEditDialog = (app: Application) => {
    setEditId(app.id);
    setEditServerId(app.serverId);
    setEditName(app.name);
    setEditDescription(app.description || "");
    setEditIcon(app.icon || "");
    setEditLocalURL(app.localURL || "");
    setEditPublicURL(app.publicURL || "");
    
    if (app.uptimecheckUrl) {
      setEditCustomUptimeCheck(true);
      setEditUptimecheckUrl(app.uptimecheckUrl);
    } else {
      setEditCustomUptimeCheck(false);
      setEditUptimecheckUrl("");
    }
  };

  const edit = async () => {
    if (!editId) return;

    try {
      await axios.put("/api/applications/edit", {
        id: editId,
        serverId: editServerId,
        name: editName,
        description: editDescription,
        icon: editIcon,
        publicURL: editPublicURL,
        localURL: editLocalURL,
        uptimecheckUrl: editCustomUptimeCheck ? editUptimecheckUrl : "",
      });
      getApplications();
      setEditId(null);
      toast.success(t('Applications.Messages.EditSuccess'));
    } catch (error: any) {
      console.log(error.response.data);
      toast.error(t('Applications.Messages.EditError'));
    }
  };

  const searchApplications = async () => {
    try {
      setIsSearching(true);
      const response = await axios.post<{ results: Application[] }>(
        "/api/applications/search",
        { searchterm: searchTerm }
      );
      setApplications(response.data.results);
      setIsSearching(false);
    } catch (error: any) {
      console.error("Search error:", error.response?.data);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchTerm.trim() === "") {
        getApplications();
      } else {
        searchApplications();
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const generateIconURL = async () => {
    setIcon("https://cdn.jsdelivr.net/gh/selfhst/icons/png/" + name.toLowerCase() + ".png")
  }

  const generateEditIconURL = async () => {
    setEditIcon("https://cdn.jsdelivr.net/gh/selfhst/icons/png/" + editName.toLowerCase() + ".png")
  }

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
                  <BreadcrumbPage>{t('Applications.Breadcrumb.MyInfrastructure')}</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{t('Applications.Breadcrumb.Applications')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Toaster />
        <div className="p-6">
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold">{t('Applications.Title')}</span>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" title={t('Applications.Views.ChangeView')}>
                    {isCompactLayout ? (
                      <Grid3X3 className="h-4 w-4" />
                    ) : isGridLayout ? (
                      <LayoutGrid className="h-4 w-4" />
                    ) : (
                      <List className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => toggleLayout("standard")}>
                    <List className="h-4 w-4 mr-2" /> {t('Applications.Views.ListView')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleLayout("grid")}>
                    <LayoutGrid className="h-4 w-4 mr-2" /> {t('Applications.Views.GridView')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toggleLayout("compact")}>
                    <Grid3X3 className="h-4 w-4 mr-2" /> {t('Applications.Views.CompactView')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    {itemsPerPage} {itemsPerPage === 1 ? 'item' : 'items'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {![5, 10, 15, 20, 25].includes(itemsPerPage) ? (
                    <SelectItem value={String(itemsPerPage)}>
                      {itemsPerPage} {itemsPerPage === 1 ? 'item' : 'items'} (custom)
                    </SelectItem>
                  ) : null}
                  <SelectItem value="5">5 items</SelectItem>
                  <SelectItem value="10">10 items</SelectItem>
                  <SelectItem value="15">15 items</SelectItem>
                  <SelectItem value="20">20 items</SelectItem>
                  <SelectItem value="25">25 items</SelectItem>
                  <div className="p-2 border-t mt-1">
                    <Label htmlFor="custom-items" className="text-xs font-medium">Custom (1-100)</Label>
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
                          // Don't immediately apply the change while typing
                          // Just validate the input for visual feedback
                          const value = parseInt(e.target.value);
                          if (isNaN(value) || value < 1 || value > 100) {
                            e.target.classList.add("border-red-500");
                          } else {
                            e.target.classList.remove("border-red-500");
                          }
                        }}
                        onBlur={(e) => {
                          // Apply the change when the input loses focus
                          const value = parseInt(e.target.value);
                          if (value >= 1 && value <= 100) {
                            handleItemsPerPageChange(e.target.value);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            // Clear any existing debounce timer to apply immediately
                            if (debounceTimerRef.current) {
                              clearTimeout(debounceTimerRef.current);
                              debounceTimerRef.current = null;
                            }
                            
                            const value = parseInt((e.target as HTMLInputElement).value);
                            if (value >= 1 && value <= 100) {
                              // Apply change immediately on Enter
                              const validatedValue = Math.min(Math.max(value, 1), 100);
                              setItemsPerPage(validatedValue);
                              setCurrentPage(1);
                              Cookies.set("itemsPerPage-app", String(validatedValue), {
                                expires: 365,
                                path: "/",
                                sameSite: "strict",
                              });
                              
                              // Close the dropdown
                              document.body.click();
                            }
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">items</span>
                    </div>
                  </div>
                </SelectContent>
              </Select>
              {servers.length === 0 ? (
                <p className="text-muted-foreground">
                  {t('Applications.Messages.AddServerFirst')}
                </p>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <Plus />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-[90vw] w-[600px] max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('Applications.Add.Title')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        <div className="space-y-4 pt-4">
                          <div className="grid w-full items-center gap-1.5">
                            <Label>{t('Applications.Add.Name')}</Label>
                            <Input
                              placeholder={t('Applications.Add.NamePlaceholder')}
                              onChange={(e) => setName(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>{t('Applications.Add.Server')}</Label>
                            <Select
                              onValueChange={(v) => setServerId(Number(v))}
                              required
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={t('Applications.Add.SelectServer')} />
                              </SelectTrigger>
                              <SelectContent>
                                {servers.map((server) => (
                                  <SelectItem
                                    key={server.id}
                                    value={String(server.id)}
                                  >
                                    {server.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>
                              {t('Applications.Add.Description')}{" "}
                              <span className="text-stone-600">{t('Common.optional')}</span>
                            </Label>
                            <Textarea
                              placeholder={t('Applications.Add.DescriptionPlaceholder')}
                              onChange={(e) => setDescription(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>{t('Applications.Add.IconURL')}</Label>
                            <div className="flex gap-2">
                              <Input
                                placeholder={t('Applications.Add.IconURLPlaceholder')}
                                onChange={(e) => setIcon(e.target.value)}
                                value={icon}
                            />
                            <Button variant="outline" size="icon" onClick={generateIconURL}>
                                <Zap />
                              </Button>
                            </div>
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>{t('Applications.Add.PublicURL')}</Label>
                            <Input
                              placeholder={t('Applications.Add.PublicURLPlaceholder')}
                              onChange={(e) => setPublicURL(e.target.value)}
                            />
                          </div>
                          <div className="grid w-full items-center gap-1.5">
                            <Label>
                              {t('Applications.Add.LocalURL')}{" "}
                              <span className="text-stone-600">{t('Common.optional')}</span>
                            </Label>
                            <Input
                              placeholder={t('Applications.Add.LocalURLPlaceholder')}
                              onChange={(e) => setLocalURL(e.target.value)}
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="custom-uptime-check"
                              checked={customUptimeCheck}
                              onChange={(e) => setCustomUptimeCheck(e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <Label htmlFor="custom-uptime-check">{t('Applications.Add.CustomUptimeCheck')}</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  {t('Applications.Add.CustomUptimeCheckTooltip')}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          {customUptimeCheck && (
                            <div className="grid w-full items-center gap-1.5">
                              <Label>{t('Applications.Add.UptimeCheckURL')}</Label>
                              <Input
                                placeholder={t('Applications.Add.UptimeCheckURLPlaceholder')}
                                value={uptimecheckUrl}
                                onChange={(e) => setUptimecheckUrl(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('Common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={add}
                        disabled={!name || !publicURL || !serverId}
                      >
                        {t('Common.add')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 mb-4 pt-2">
            <Input
              id="application-search"
              placeholder={t('Applications.Search.Placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <br />
          {!loading ? (
            <div
              className={
                isCompactLayout
                  ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2"
                  : isGridLayout
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                  : "space-y-4"
              }
            >
              {applications.map((app) => (
                isCompactLayout ? (
                  <div
                    key={app.id}
                    className="bg-card rounded-md border p-3 flex flex-col items-center justify-between h-[120px] w-full cursor-pointer hover:shadow-md transition-shadow relative"
                    onClick={() => window.open(app.publicURL, "_blank")}
                    title={app.name}
                  >
                    <div className="absolute top-1 right-1">
                      <StatusIndicator isOnline={app.online} showLabel={false} />
                    </div>
                    <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center">
                      {app.icon ? (
                        <img
                          src={app.icon}
                          alt={app.name}
                          className="w-full h-full object-contain rounded-md"
                        />
                      ) : (
                        <span className="text-gray-500 text-xs">{t('Applications.Card.Icon')}</span>
                      )}
                    </div>
                    <div className="text-center mt-2">
                      <h3 className="text-sm font-medium truncate w-full max-w-[110px]">{app.name}</h3>
                    </div>
                  </div>
                ) : (
                  <Card
                    key={app.id}
                    className={
                      isGridLayout
                        ? "h-full flex flex-col justify-between relative"
                        : "w-full mb-4 relative"
                    }
                  >
                    <CardHeader>
                      <div className="absolute top-2 right-2">
                        <StatusIndicator isOnline={app.online} />
                      </div>
                      <div className={`flex ${isGridLayout ? 'flex-col' : 'items-center justify-between'} w-full mt-4 mb-4`}>
                        <div className="flex items-center">
                          <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center rounded-md">
                            {app.icon ? (
                              <img
                                src={app.icon}
                                alt={app.name}
                                className="w-full h-full object-contain rounded-md"
                              />
                            ) : (
                              <span className="text-gray-500 text-xs">{t('Applications.Card.Image')}</span>
                            )}
                          </div>
                          <div className="ml-4">
                            <CardTitle className="text-2xl font-bold">
                              {app.name}
                            </CardTitle>
                            <CardDescription className="text-md">
                              {app.description}
                              {app.description && (
                                <br className="hidden md:block" />
                              )}
                              {t('Applications.Card.Server')}: {app.server || t('Applications.Card.NoServer')}
                            </CardDescription>
                          </div>
                        </div>
                        
                        {!isGridLayout && (
                          <div className="flex flex-col items-end justify-start space-y-2 w-[190px]">
                            <div className="flex items-center gap-2 w-full">
                              <div className="flex flex-col space-y-2 flex-grow">
                                <Button
                                  variant="outline"
                                  className="gap-2 w-full"
                                  onClick={() =>
                                    window.open(app.publicURL, "_blank")
                                  }
                                >
                                  <Link className="h-4 w-4" />
                                  {t('Applications.Card.PublicURL')}
                                </Button>
                                {app.localURL && (
                                  <Button
                                    variant="outline"
                                    className="gap-2 w-full"
                                    onClick={() =>
                                      window.open(app.localURL, "_blank")
                                    }
                                  >
                                    <Home className="h-4 w-4" />
                                    {t('Applications.Card.LocalURL')}
                                  </Button>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="destructive"
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => deleteApplication(app.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="icon"
                                      className="h-9 w-9"
                                      onClick={() => openEditDialog(app)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent className="max-w-[90vw] w-[600px] max-h-[90vh] overflow-y-auto">
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Edit Application
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        <div className="space-y-4 pt-4">
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>Name</Label>
                                            <Input
                                              placeholder="e.g. Portainer"
                                              value={editName}
                                              onChange={(e) =>
                                                setEditName(e.target.value)
                                              }
                                            />
                                          </div>
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>Server</Label>
                                            <Select
                                              value={
                                                editServerId !== null
                                                  ? String(editServerId)
                                                  : undefined
                                              }
                                              onValueChange={(v) =>
                                                setEditServerId(Number(v))
                                              }
                                              required
                                            >
                                              <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select server" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {servers.map((server) => (
                                                  <SelectItem
                                                    key={server.id}
                                                    value={String(server.id)}
                                                  >
                                                    {server.name}
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>
                                              Description{" "}
                                              <span className="text-stone-600">
                                                (optional)
                                              </span>
                                            </Label>
                                            <Textarea
                                              placeholder="Application description"
                                              value={editDescription}
                                              onChange={(e) =>
                                                setEditDescription(e.target.value)
                                              }
                                            />
                                          </div>
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>
                                              Icon URL{" "}
                                              <span className="text-stone-600">
                                                (optional)
                                              </span>
                                            </Label>
                                            <div className="flex gap-2">
                                              <Input
                                                placeholder="https://example.com/icon.png"
                                                value={editIcon}
                                                onChange={(e) =>
                                                  setEditIcon(e.target.value)
                                                }
                                              />
                                              <Button variant="outline" size="icon" onClick={generateEditIconURL}>
                                                <Zap />
                                              </Button>
                                            </div>
                                          </div>
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>Public URL</Label>
                                            <Input
                                              placeholder="https://example.com"
                                              value={editPublicURL}
                                              onChange={(e) =>
                                                setEditPublicURL(e.target.value)
                                              }
                                            />
                                          </div>
                                          <div className="grid w-full items-center gap-1.5">
                                            <Label>
                                              Local URL{" "}
                                              <span className="text-stone-600">
                                                (optional)
                                              </span>
                                            </Label>
                                            <Input
                                              placeholder="http://localhost:3000"
                                              value={editLocalURL}
                                              onChange={(e) =>
                                                setEditLocalURL(e.target.value)
                                              }
                                            />
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <input
                                              type="checkbox"
                                              id="edit-custom-uptime-check"
                                              checked={editCustomUptimeCheck}
                                              onChange={(e) => setEditCustomUptimeCheck(e.target.checked)}
                                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                            <Label htmlFor="edit-custom-uptime-check">Custom Uptime Check URL</Label>
                                            <TooltipProvider>
                                              <Tooltip>
                                                <TooltipTrigger>
                                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                  When enabled, this URL replaces the Public URL for uptime monitoring checks
                                                </TooltipContent>
                                              </Tooltip>
                                            </TooltipProvider>
                                          </div>
                                          {editCustomUptimeCheck && (
                                            <div className="grid w-full items-center gap-1.5">
                                              <Label>Uptime Check URL</Label>
                                              <Input
                                                placeholder="https://example.com/status"
                                                value={editUptimecheckUrl}
                                                onChange={(e) => setEditUptimecheckUrl(e.target.value)}
                                              />
                                            </div>
                                          )}
                                        </div>
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={edit}
                                        disabled={
                                          !editName || !editPublicURL || !editServerId
                                        }
                                      >
                                        Save Changes
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    {isGridLayout && (
                      <CardFooter className="mt-auto">
                        <div className="flex items-center gap-2 w-full">
                          <div className={`grid ${app.localURL ? 'grid-cols-2' : 'grid-cols-1'} gap-2 flex-grow`}>
                            <Button
                              variant="outline"
                              className="gap-2 w-full"
                              onClick={() => window.open(app.publicURL, "_blank")}
                            >
                              <Link className="h-4 w-4" />
                              {t('Applications.Card.PublicURL')}
                            </Button>
                            {app.localURL && (
                              <Button
                                variant="outline"
                                className="gap-2 w-full"
                                onClick={() => window.open(app.localURL, "_blank")}
                              >
                                <Home className="h-4 w-4" />
                                {t('Applications.Card.LocalURL')}
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-9 w-9"
                              onClick={() => deleteApplication(app.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="icon"
                                  className="h-9 w-9"
                                  onClick={() => openEditDialog(app)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="max-w-[90vw] w-[600px] max-h-[90vh] overflow-y-auto">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Edit Application
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    <div className="space-y-4 pt-4">
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>Name</Label>
                                        <Input
                                          placeholder="e.g. Portainer"
                                          value={editName}
                                          onChange={(e) =>
                                            setEditName(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>Server</Label>
                                        <Select
                                          value={
                                            editServerId !== null
                                              ? String(editServerId)
                                              : undefined
                                          }
                                          onValueChange={(v) =>
                                            setEditServerId(Number(v))
                                          }
                                          required
                                        >
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select server" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {servers.map((server) => (
                                              <SelectItem
                                                key={server.id}
                                                value={String(server.id)}
                                              >
                                                {server.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>
                                          Description{" "}
                                          <span className="text-stone-600">
                                            (optional)
                                          </span>
                                        </Label>
                                        <Textarea
                                          placeholder="Application description"
                                          value={editDescription}
                                          onChange={(e) =>
                                            setEditDescription(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>
                                          Icon URL{" "}
                                          <span className="text-stone-600">
                                            (optional)
                                          </span>
                                        </Label>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="https://example.com/icon.png"
                                            value={editIcon}
                                            onChange={(e) =>
                                              setEditIcon(e.target.value)
                                            }
                                          />
                                          <Button variant="outline" size="icon" onClick={generateEditIconURL}>
                                            <Zap />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>Public URL</Label>
                                        <Input
                                          placeholder="https://example.com"
                                          value={editPublicURL}
                                          onChange={(e) =>
                                            setEditPublicURL(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="grid w-full items-center gap-1.5">
                                        <Label>
                                          Local URL{" "}
                                          <span className="text-stone-600">
                                            (optional)
                                          </span>
                                        </Label>
                                        <Input
                                          placeholder="http://localhost:3000"
                                          value={editLocalURL}
                                          onChange={(e) =>
                                            setEditLocalURL(e.target.value)
                                          }
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          id="edit-custom-uptime-check"
                                          checked={editCustomUptimeCheck}
                                          onChange={(e) => setEditCustomUptimeCheck(e.target.checked)}
                                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="edit-custom-uptime-check">Custom Uptime Check URL</Label>
                                        <TooltipProvider>
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              When enabled, this URL replaces the Public URL for uptime monitoring checks
                                            </TooltipContent>
                                          </Tooltip>
                                        </TooltipProvider>
                                      </div>
                                      {editCustomUptimeCheck && (
                                        <div className="grid w-full items-center gap-1.5">
                                          <Label>Uptime Check URL</Label>
                                          <Input
                                            placeholder="https://example.com/status"
                                            value={editUptimecheckUrl}
                                            onChange={(e) => setEditUptimecheckUrl(e.target.value)}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={edit}
                                    disabled={
                                      !editName || !editPublicURL || !editServerId
                                    }
                                  >
                                    Save Changes
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                )
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="inline-block" role="status" aria-label="loading">
                <svg
                  className="w-6 h-6 stroke-white animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clip-path="url(#clip0_9023_61563)">
                    <path
                      d="M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444"
                      stroke="stroke-current"
                      stroke-width="1.4"
                      stroke-linecap="round"
                      className="my-path"
                    ></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_9023_61563">
                      <rect width="24" height="24" fill="white"></rect>
                    </clipPath>
                  </defs>
                </svg>
                <span className="sr-only">{t('Common.Loading')}</span>
              </div>
            </div>
          )}
          <div className="pt-4 pb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm text-muted-foreground">
                {totalItems > 0 
                  ? t('Applications.Pagination.Showing', { start: startItem, end: endItem, total: totalItems })
                  : t('Applications.Pagination.NoApplications')}
              </div>
            </div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={handlePrevious}
                    isActive={currentPage > 1}
                    style={{ cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink isActive>{currentPage}</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    onClick={handleNext}
                    isActive={currentPage < maxPage}
                    style={{ cursor: currentPage === maxPage ? 'not-allowed' : 'pointer' }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
