"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface StatusIndicatorProps {
  isOnline?: boolean
  className?: string
  showLabel?: boolean
  pulseAnimation?: boolean
}

export function StatusIndicator({
  isOnline = false,
  className,
  showLabel = true,
  pulseAnimation = true,
}: StatusIndicatorProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-2 px-2 py-1 border-transparent transition-colors duration-300",
        isOnline
          ? "bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-300"
          : "bg-red-100 dark:bg-red-950/30 text-red-800 dark:text-red-300",
        className,
      )}
    >
      <span className={cn("relative flex h-2.5 w-2.5 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")}>
        {isOnline && pulseAnimation && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        )}
      </span>
      {showLabel && <span className="text-xs font-medium">{isOnline ? "Online" : "Offline"}</span>}
    </Badge>
  )
}
