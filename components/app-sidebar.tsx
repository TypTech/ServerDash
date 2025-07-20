"use client"

import type * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import {
  AppWindow,
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
          title: t('Applications'),
          icon: AppWindow,
          url: "/dashboard/applications",
        },
        {
          title: t('Uptime'),
          icon: Activity,
          url: "/dashboard/uptime",
        },
        {
          title: t('Network'),
          icon: Network,
          url: "/dashboard/network",
        },
      ],
    },
    {
      title: t('Settings'),
      icon: Settings,
      url: "/dashboard/settings",
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
              <a href="https://github.com/crocofied/corecontrol" target="_blank" rel="noreferrer noopener" className="transition-all hover:opacity-80">
                <div className="flex items-center justify-center rounded-lg overflow-hidden bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm">
                  <Image src="/logo.png" width={48} height={48} alt="CoreControl Logo" className="object-cover" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold text-base">CoreControl</span>
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
                            "font-medium transition-all",
                            (hasActiveChild(item.items) || isActive(item.url)) &&
                              "text-sidebar-accent-foreground bg-sidebar-accent/50",
                          )}
                        >
                          {item.icon && <item.icon className="h-4 w-4" />}
                          <span>{item.title}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild isActive={isActive(subItem.url)} className="transition-all">
                                <Link href={subItem.url} className="flex items-center">
                                  {subItem.icon && <subItem.icon className="h-3.5 w-3.5 mr-2" />}
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
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
                        "font-medium transition-all",
                        isActive(item.url) && "text-sidebar-accent-foreground bg-sidebar-accent/50",
                      )}
                    >
                      <Link href={item.url}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ),
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarFooter className="border-t border-sidebar-border/30 pt-4 mt-auto">
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 border-none shadow-none"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t('Logout')}
          </Button>
        </SidebarFooter>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}
