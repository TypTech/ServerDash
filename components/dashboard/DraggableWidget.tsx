"use client"

import React from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DashboardWidget, getWidgetConfig } from '@/lib/widget-registry'

interface DraggableWidgetProps {
  widget: DashboardWidget
  children: React.ReactNode
  onRemove: (widgetId: string) => void
  isEditing: boolean
}

export function DraggableWidget({ widget, children, onRemove, isEditing }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const widgetConfig = getWidgetConfig(widget.widgetId)
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group ${
        widgetConfig?.defaultSize.cols === 2 ? 'lg:col-span-2' : ''
      }`}
    >
      {/* Edit Mode Overlay */}
      {isEditing && (
        <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg z-10">
          <div className="absolute top-2 right-2 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-white border-blue-300 hover:bg-blue-50"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-6 w-6 p-0 bg-white border-red-300 hover:bg-red-50"
              onClick={() => onRemove(widget.id)}
            >
              <X className="h-3 w-3 text-red-500" />
            </Button>
          </div>
          <div className="absolute top-2 left-2">
            <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
              {widgetConfig?.name}
            </div>
          </div>
        </div>
      )}
      
      {/* Widget Content */}
      <div className={isEditing ? 'pointer-events-none' : ''}>
        {children}
      </div>
    </div>
  )
} 