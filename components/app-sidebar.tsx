"use client"

import type * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  Settings,
  LayoutDashboardIcon,
  Briefcase,
  Server,
  Network,
  Activity,
  LogOut,
  ChevronDown,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import packageJson from "@/package.json"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useTranslations } from "next-intl"
interface NavItem {
  title: string
  icon?: React.ComponentType<any>
  url: string
  isActive?: boolean
  items?: NavItem[]
}



export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations('Sidebar')
  const data: { navMain: NavItem[] } = {
  navMain: [
    {
      title: t('Dashboard'),
      icon: LayoutDashboardIcon,
      url: "/dashboard",
    },
    {
      title: t('My Infrastructure'),
      url: "#",
      icon: Briefcase,
      items: [
        {
          title: t('Servers'),
          icon: Server,
          url: "/dashboard/servers",
        },
        {
          title: t('NetworkDevices'),
          icon: Network,
          url: "/dashboard/network-devices",
        },
        {
          title: t('Uptime'),
          icon: Activity,
          url: "/dashboard/uptime",
        },
        {
          title: t('Infrastructure'),
          icon: Network,
          url: "/dashboard/infrastructure",
        },
      ],
    },
  ],
}

  const router = useRouter()
  const pathname = usePathname()

  const logout = async () => {
    Cookies.remove("token")
    router.push("/")
  }

  // Check if a path is active (exact match or starts with path for parent items)
  const isActive = (path: string) => {
    if (path === "#") return false
    return pathname === path || (path !== "/dashboard" && pathname?.startsWith(path))
  }

  // Check if any child item is active
  const hasActiveChild = (items?: NavItem[]) => {
    if (!items) return false
    return items.some((item) => isActive(item.url))
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader className="border-b border-sidebar-border/30 pb-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="gap-3">
              <a href="https://github.com/serverdash/serverdash" target="_blank" rel="noreferrer noopener" className="transition-all hover:opacity-80">
                <div className="flex items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
                  <Image src="/logo.png" width={48} height={48} alt="ServerDash Logo" className="object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-base">ServerDash</span>
                  <span className="text-xs text-sidebar-foreground/70">v{packageJson.version}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col h-full py-4">
        <SidebarGroup className="flex-grow">
          <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/60 uppercase tracking-wider px-4 mb-2">
            {t('Main Navigation')}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) =>
                item.items?.length ? (
                  <Collapsible key={item.title} defaultOpen={hasActiveChild(item.items)} className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          className={cn(
                            "font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground group p-3",
                            (hasActiveChild(item.items) || isActive(item.url)) &&
                              "text-sidebar-accent-foreground bg-sidebar-accent/50 shadow-sm",
                          )}
                        >
                          <div className="flex items-center w-full">
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200",
                              (hasActiveChild(item.items) || isActive(item.url))
                                ? "bg-primary text-primary-foreground shadow-sm" 
                                : "bg-sidebar-accent/20 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/40 group-hover:text-sidebar-foreground"
                            )}>
                              {item.icon && <item.icon className="h-4 w-4" />}
                            </div>
                            <span className="text-sm flex-1">{item.title}</span>
                            <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                          </div>
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            subItem.items?.length ? (
                              <Collapsible key={subItem.title} defaultOpen={hasActiveChild(subItem.items)} className="group/subcollapsible">
                                <SidebarMenuSubItem>
                                  <CollapsibleTrigger asChild>
                                    <SidebarMenuSubButton 
                                      className={cn(
                                        "transition-all duration-200 hover:bg-sidebar-accent/30 group ml-4",
                                        (hasActiveChild(subItem.items) || isActive(subItem.url)) && "bg-sidebar-accent/30"
                                      )}
                                    >
                                      <div className="flex items-center w-full py-2">
                                        <div className={cn(
                                          "flex items-center justify-center w-6 h-6 rounded-md mr-3 transition-all duration-200",
                                          (hasActiveChild(subItem.items) || isActive(subItem.url))
                                            ? "bg-primary text-primary-foreground shadow-sm" 
                                            : "bg-sidebar-accent/15 text-sidebar-foreground/60 group-hover:bg-sidebar-accent/30 group-hover:text-sidebar-foreground"
                                        )}>
                                          {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                        </div>
                                        <span className="text-xs flex-1">{subItem.title}</span>
                                        <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]/subcollapsible:rotate-180" />
                                      </div>
                                    </SidebarMenuSubButton>
                                  </CollapsibleTrigger>
                                  <CollapsibleContent>
                                    <div className="ml-6 mt-1">
                                      {subItem.items.map((subSubItem) => (
                                        <div key={subSubItem.title} className="mb-1">
                                          <Link 
                                            href={subSubItem.url} 
                                            className={cn(
                                              "flex items-center py-2 px-3 rounded-md text-xs transition-all duration-200 hover:bg-sidebar-accent/20",
                                              isActive(subSubItem.url) && "bg-sidebar-accent/30 text-sidebar-accent-foreground"
                                            )}
                                          >
                                            <div className={cn(
                                              "flex items-center justify-center w-5 h-5 rounded mr-2 transition-all duration-200",
                                              isActive(subSubItem.url)
                                                ? "bg-primary text-primary-foreground shadow-sm" 
                                                : "bg-sidebar-accent/10 text-sidebar-foreground/50"
                                            )}>
                                              {subSubItem.icon && <subSubItem.icon className="h-2.5 w-2.5" />}
                                            </div>
                                            <span>{subSubItem.title}</span>
                                          </Link>
                                        </div>
                                      ))}
                                    </div>
                                  </CollapsibleContent>
                                </SidebarMenuSubItem>
                              </Collapsible>
                            ) : (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton 
                                  asChild 
                                  isActive={isActive(subItem.url)} 
                                  className="transition-all duration-200 hover:bg-sidebar-accent/30 group ml-4"
                                >
                                  <Link href={subItem.url} className="flex items-center py-2">
                                    <div className={cn(
                                      "flex items-center justify-center w-6 h-6 rounded-md mr-3 transition-all duration-200",
                                      isActive(subItem.url)
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "bg-sidebar-accent/15 text-sidebar-foreground/60 group-hover:bg-sidebar-accent/30 group-hover:text-sidebar-foreground"
                                    )}>
                                      {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                    </div>
                                    <span className="text-xs">{subItem.title}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            )
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ) : (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={cn(
                        "font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground group p-3",
                        isActive(item.url) && "text-sidebar-accent-foreground bg-sidebar-accent/50 shadow-sm",
                      )}
                    >
                      <Link href={item.url} className="flex items-center">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200",
                          isActive(item.url)
                            ? "bg-primary text-primary-foreground shadow-sm" 
                            : "bg-sidebar-accent/20 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/40 group-hover:text-sidebar-foreground"
                        )}>
                          {item.icon && <item.icon className="h-4 w-4" />}
                        </div>
                        <span className="text-sm">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter className="border-t border-sidebar-border/30 pt-4 mt-auto space-y-2">
          {/* Settings Button */}
          <Button
            variant="ghost"
            asChild
            className={cn(
              "w-full justify-start font-medium transition-all duration-200 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground group",
              isActive("/dashboard/settings") && "bg-sidebar-accent/50 text-sidebar-accent-foreground shadow-sm"
            )}
          >
            <Link href="/dashboard/settings" className="flex items-center">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg mr-3 transition-all duration-200",
                              isActive("/dashboard/settings") 
                ? "bg-primary text-primary-foreground shadow-sm" 
                : "bg-sidebar-accent/20 text-sidebar-foreground/70 group-hover:bg-sidebar-accent/40 group-hover:text-sidebar-foreground"
              )}>
                <Settings className="h-4 w-4" />
              </div>
              <span className="text-sm">{t('Settings')}</span>
            </Link>
          </Button>

          {/* Divider */}
          <div className="h-px bg-sidebar-border/30 mx-2" />

          {/* Logout Button */}
          <Button
            variant="ghost"
            className="w-full justify-start font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-all duration-200 group"
            onClick={logout}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg mr-3 bg-destructive/10 text-destructive group-hover:bg-destructive/20 transition-all duration-200">
              <LogOut className="h-4 w-4" />
            </div>
            <span className="text-sm">{t('Logout')}</span>
          </Button>
        </SidebarFooter>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
