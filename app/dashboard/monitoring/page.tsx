"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { useRouter } from "next/navigation"
import axios from "axios"
import { AppSidebar } from "@/components/app-sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { GlancesMonitorWidget } from "@/components/glances-monitor-widget"
import { useTranslations } from "next-intl"

function MonitoringContent() {
  const t = useTranslations('Dashboard')
  
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
                  <BreadcrumbPage className="font-medium">System Monitoring</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="p-8 subtle-grid">
          <div className="relative mb-12">
            <h1 className="title-large clean-gradient mb-4">System Monitoring</h1>
            <p className="subtitle max-w-2xl">
              Monitor all your servers with real-time metrics and performance insights
            </p>
          </div>
          <GlancesMonitorWidget />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function MonitoringPage() {
  const router = useRouter()
  const [isAuthChecked, setIsAuthChecked] = useState(false)
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    const token = Cookies.get("token")
    if (!token) {
      router.push("/")
    } else {
      const checkToken = async () => {
        try {
          const response = await axios.post("/api/auth/validate", {
            token: token,
          })

          if (response.status === 200) {
            setIsValid(true)
          }
        } catch (error: any) {
          Cookies.remove("token")
          router.push("/")
        }
      }
      checkToken()
    }
    setIsAuthChecked(true)
  }, [router])

  if (!isAuthChecked) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className='inline-block' role='status' aria-label='loading'>
          <svg className='w-6 h-6 stroke-white animate-spin ' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
            <g clip-path='url(#clip0_9023_61563)'>
              <path d='M14.6437 2.05426C11.9803 1.2966 9.01686 1.64245 6.50315 3.25548C1.85499 6.23817 0.504864 12.4242 3.48756 17.0724C6.47025 21.7205 12.6563 23.0706 17.3044 20.088C20.4971 18.0393 22.1338 14.4793 21.8792 10.9444' stroke='stroke-current' stroke-width='1.4' stroke-linecap='round' className='my-path'></path>
            </g>
            <defs>
              <clipPath id='clip0_9023_61563'>
                <rect width='24' height='24' fill='white'></rect>
              </clipPath>
            </defs>
          </svg>
          <span className='sr-only'>Loading...</span>
        </div>
      </div>
    )
  }

  return isValid ? <MonitoringContent /> : null
} 