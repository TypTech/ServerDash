"use client";

import React, { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import axios from "axios"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { StatusIndicator } from "@/components/status-indicator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Plus, MoreVertical, Edit, Trash, List, LayoutGrid, Grid3X3, ChevronDown, HelpCircle, ExternalLink } from "lucide-react"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

interface VirtualMachine {
  id: number
  name: string
  description?: string
  icon: string
  publicURL: string
  localURL?: string
  uptimecheckUrl?: string
  server: string
  serverId: number
  online: boolean
}

interface Server {
  id: number
  name: string
}

interface VirtualMachinesResponse {
  virtualMachines: VirtualMachine[]
  servers: Server[]
  maxPage: number
  totalItems?: number
}

export default function VirtualMachines() {
  const t = useTranslations('VirtualMachines')
  
  // State management
  const [virtualMachines, setVirtualMachines] = useState<VirtualMachine[]>([])
  const [servers, setServers] = useState<Server[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingVirtualMachine, setEditingVirtualMachine] = useState<VirtualMachine | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('grid')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [maxPage, setMaxPage] = useState(1)
  
  // Form fields
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [icon, setIcon] = useState("")
  const [publicURL, setPublicURL] = useState("")
  const [localURL, setLocalURL] = useState("")
  const [serverId, setServerId] = useState<number>(0)
  const [customUptimeCheck, setCustomUptimeCheck] = useState(false)
  const [uptimecheckUrl, setUptimecheckUrl] = useState("")

  // Input validation
  const isValidNumber = (value: string) => {
    const num = parseInt(value)
    return !isNaN(num) && num >= 1 && num <= 100
  }

  const handleItemsPerPageChange = (value: string) => {
    if (!isValidNumber(value)) {
      toast.error(t('Messages.NumberValidation'))
      return
    }
    setItemsPerPage(parseInt(value))
    setCurrentPage(1) // Reset to first page when changing items per page
  }

  const resetForm = () => {
    setName("")
    setDescription("")
    setIcon("")
    setPublicURL("")
    setLocalURL("")
    setServerId(0)
    setCustomUptimeCheck(false)
    setUptimecheckUrl("")
  }

  const add = async () => {
    try {
      await axios.post("/api/virtual-machines/add", {
        name,
        description,
        icon,
        publicURL,
        localURL,
        serverId,
        uptimecheckUrl: customUptimeCheck ? uptimecheckUrl : "",
      });
      getVirtualMachines();
      toast.success(t('Messages.AddSuccess'));
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Messages.AddError'));
    }
  };

  const getVirtualMachines = async () => {
    try {
      setLoading(true);
      const response = await axios.post<VirtualMachinesResponse>(
        "/api/virtual-machines/get",
        { page: currentPage, ITEMS_PER_PAGE: itemsPerPage }
      );
      setVirtualMachines(response.data.virtualMachines);
      setServers(response.data.servers);
      setMaxPage(response.data.maxPage);
      if (response.data.totalItems !== undefined) {
        setTotalItems(response.data.totalItems);
      }
      setLoading(false);
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Messages.GetError'));
    }
  };

  // Calculate current range of items being displayed
  const [totalItems, setTotalItems] = useState<number>(0);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  useEffect(() => {
    getVirtualMachines();
  }, [currentPage, itemsPerPage]);

  const handlePrevious = () => setCurrentPage((prev) => Math.max(1, prev - 1));
  const handleNext = () =>
    setCurrentPage((prev) => Math.min(maxPage, prev + 1));

  const deleteVirtualMachine = async (id: number) => {
    try {
      await axios.post("/api/virtual-machines/delete", { id });
      getVirtualMachines();
      toast.success(t('Messages.DeleteSuccess'));
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Messages.DeleteError'));
    }
  };

  const openEditDialog = (virtualMachine: VirtualMachine) => {
    setEditingVirtualMachine(virtualMachine);
    setName(virtualMachine.name);
    setDescription(virtualMachine.description || "");
    setIcon(virtualMachine.icon);
    setPublicURL(virtualMachine.publicURL);
    setLocalURL(virtualMachine.localURL || "");
    setServerId(virtualMachine.serverId);
    setCustomUptimeCheck(!!virtualMachine.uptimecheckUrl);
    setUptimecheckUrl(virtualMachine.uptimecheckUrl || "");
    setShowEditDialog(true);
  };

  const editVirtualMachine = async () => {
    try {
      await axios.put("/api/virtual-machines/edit", {
        id: editingVirtualMachine?.id,
        name,
        description,
        icon,
        publicURL,
        localURL,
        serverId,
        uptimecheckUrl: customUptimeCheck ? uptimecheckUrl : "",
      });
      getVirtualMachines();
      setShowEditDialog(false);
      toast.success(t('Messages.EditSuccess'));
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Messages.EditError'));
    }
  };

  const searchVirtualMachines = async () => {
    try {
      setLoading(true);
      const response = await axios.post<{ results: VirtualMachine[] }>(
        "/api/virtual-machines/search",
        { searchterm: searchTerm }
      );
      setVirtualMachines(response.data.results);
      setLoading(false);
    } catch (error: any) {
      console.log(error.response?.data);
      toast.error(t('Messages.GetError'));
    }
  };

  useEffect(() => {
    if (searchTerm.trim() === "") {
      getVirtualMachines();
    } else {
      searchVirtualMachines();
    }
  }, [searchTerm]);

  const VirtualMachineCard = ({ vm }: { vm: VirtualMachine }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border-border/50 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
              {vm.icon ? (
                <img src={vm.icon} alt={vm.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-6 h-6 bg-primary/20 rounded"></div>
              )}
            </div>
            <div>
              <CardTitle className="text-sm font-medium line-clamp-1">{vm.name}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                {t('Card.Server')}: {vm.server}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <StatusIndicator isOnline={vm.online} showLabel={false} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditDialog(vm)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => deleteVirtualMachine(vm.id)}
                  className="text-destructive"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {vm.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{vm.description}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {vm.publicURL && (
              <Badge variant="outline" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                {t('Card.PublicURL')}
              </Badge>
            )}
            {vm.localURL && (
              <Badge variant="outline" className="text-xs">
                {t('Card.LocalURL')}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-2 px-6">
            <SidebarTrigger className="-ml-1 hover:bg-muted transition-all duration-200" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbPage className="text-muted-foreground">/</BreadcrumbPage>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/dashboard">{t('Breadcrumb.MyInfrastructure')}</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-medium">{t('Breadcrumb.VirtualMachines')}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-8">
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{t('Title')}</h1>
              </div>
              
              <div className="flex items-center gap-3">
                {/* View Mode Selector */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" title={t('Views.ChangeView')}>
                      {viewMode === 'list' && <List className="h-4 w-4" />}
                      {viewMode === 'grid' && <LayoutGrid className="h-4 w-4" />}
                      {viewMode === 'compact' && <Grid3X3 className="h-4 w-4" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setViewMode('list')}>
                      <List className="h-4 w-4 mr-2" /> {t('Views.ListView')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode('grid')}>
                      <LayoutGrid className="h-4 w-4 mr-2" /> {t('Views.GridView')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setViewMode('compact')}>
                      <Grid3X3 className="h-4 w-4 mr-2" /> {t('Views.CompactView')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder={t('Search.Placeholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Add Button */}
                <AlertDialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <AlertDialogTrigger asChild>
                    <Button onClick={() => { resetForm(); setShowAddDialog(true); }}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Virtual Machine
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('Add.Title')}</AlertDialogTitle>
                    </AlertDialogHeader>
                    
                    {servers.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">
                          {t('Messages.AddServerFirst')}
                        </p>
                      </div>
                    ) : (
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label>{t('Add.Name')}</Label>
                          <Input
                            placeholder={t('Add.NamePlaceholder')}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>{t('Add.Server')}</Label>
                          <Select value={serverId.toString()} onValueChange={(value) => setServerId(parseInt(value))}>
                            <SelectTrigger>
                              <SelectValue placeholder={t('Add.SelectServer')} />
                            </SelectTrigger>
                            <SelectContent>
                              {servers.map((server) => (
                                <SelectItem key={server.id} value={server.id.toString()}>
                                  {server.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>{t('Add.Description')}</Label>
                          <Input
                            placeholder={t('Add.DescriptionPlaceholder')}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('Add.IconURL')}</Label>
                          <Input
                            placeholder={t('Add.IconURLPlaceholder')}
                            value={icon}
                            onChange={(e) => setIcon(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('Add.PublicURL')}</Label>
                          <Input
                            placeholder={t('Add.PublicURLPlaceholder')}
                            value={publicURL}
                            onChange={(e) => setPublicURL(e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label>{t('Add.LocalURL')}</Label>
                          <Input
                            placeholder={t('Add.LocalURLPlaceholder')}
                            value={localURL}
                            onChange={(e) => setLocalURL(e.target.value)}
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="custom-uptime-check"
                              checked={customUptimeCheck}
                              onCheckedChange={setCustomUptimeCheck}
                            />
                            <Label htmlFor="custom-uptime-check">{t('Add.CustomUptimeCheck')}</Label>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-sm">{t('Add.CustomUptimeCheckTooltip')}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          
                          {customUptimeCheck && (
                            <div className="space-y-2">
                              <Label>{t('Add.UptimeCheckURL')}</Label>
                              <Input
                                placeholder={t('Add.UptimeCheckURLPlaceholder')}
                                value={uptimecheckUrl}
                                onChange={(e) => setUptimecheckUrl(e.target.value)}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setShowAddDialog(false)}>
                        Cancel
                      </AlertDialogCancel>
                      {servers.length > 0 && (
                        <AlertDialogAction
                          onClick={async () => {
                            await add();
                            setShowAddDialog(false);
                            resetForm();
                          }}
                        >
                          Add Virtual Machine
                        </AlertDialogAction>
                      )}
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>

            {/* Content */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-lg"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-muted rounded w-3/4"></div>
                          <div className="h-3 bg-muted rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded w-full"></div>
                        <div className="h-3 bg-muted rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : virtualMachines.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <p className="text-muted-foreground">{t('Pagination.NoVirtualMachines')}</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Virtual Machines Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {virtualMachines.map((vm) => (
                    <VirtualMachineCard key={vm.id} vm={vm} />
                  ))}
                </div>

                {/* Pagination */}
                {maxPage > 1 && (
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{t('Pagination.Showing', { start: startItem, end: endItem, total: totalItems })}</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="items-per-page" className="text-sm">Items per page:</Label>
                        <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                          <SelectTrigger className="w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="12">12</SelectItem>
                            <SelectItem value="24">24</SelectItem>
                            <SelectItem value="48">48</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious 
                              onClick={handlePrevious}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                          
                          {Array.from({ length: maxPage }, (_, i) => i + 1).map((page) => (
                            <PaginationItem key={page}>
                              <PaginationLink
                                onClick={() => setCurrentPage(page)}
                                isActive={page === currentPage}
                                className="cursor-pointer"
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          ))}
                          
                          <PaginationItem>
                            <PaginationNext 
                              onClick={handleNext}
                              className={currentPage === maxPage ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Edit Dialog */}
            <AlertDialog open={showEditDialog} onOpenChange={setShowEditDialog}>
              <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('Edit.Title')}</AlertDialogTitle>
                </AlertDialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label>{t('Add.Name')}</Label>
                    <Input
                      placeholder={t('Add.NamePlaceholder')}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('Add.Server')}</Label>
                    <Select value={serverId.toString()} onValueChange={(value) => setServerId(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Add.SelectServer')} />
                      </SelectTrigger>
                      <SelectContent>
                        {servers.map((server) => (
                          <SelectItem key={server.id} value={server.id.toString()}>
                            {server.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('Add.Description')}</Label>
                    <Input
                      placeholder={t('Add.DescriptionPlaceholder')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('Add.IconURL')}</Label>
                    <Input
                      placeholder={t('Add.IconURLPlaceholder')}
                      value={icon}
                      onChange={(e) => setIcon(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('Add.PublicURL')}</Label>
                    <Input
                      placeholder={t('Add.PublicURLPlaceholder')}
                      value={publicURL}
                      onChange={(e) => setPublicURL(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t('Add.LocalURL')}</Label>
                    <Input
                      placeholder={t('Add.LocalURLPlaceholder')}
                      value={localURL}
                      onChange={(e) => setLocalURL(e.target.value)}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="edit-custom-uptime-check"
                        checked={customUptimeCheck}
                        onCheckedChange={setCustomUptimeCheck}
                      />
                      <Label htmlFor="edit-custom-uptime-check">{t('Add.CustomUptimeCheck')}</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs text-sm">{t('Add.CustomUptimeCheckTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    {customUptimeCheck && (
                      <div className="space-y-2">
                        <Label>{t('Add.UptimeCheckURL')}</Label>
                        <Input
                          placeholder={t('Add.UptimeCheckURLPlaceholder')}
                          value={uptimecheckUrl}
                          onChange={(e) => setUptimecheckUrl(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowEditDialog(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={async () => {
                      await editVirtualMachine();
                      resetForm();
                    }}
                  >
                    {t('Edit.SaveButton')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
