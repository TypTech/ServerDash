"use client"

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { Edit3, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { DashboardWidget } from '@/lib/widget-registry'
import { DraggableWidget } from './DraggableWidget'
import { WidgetFactory } from './WidgetFactory'
import { AddWidgetDialog } from './AddWidgetDialog'

const DEFAULT_WIDGETS: DashboardWidget[] = [
  {
    id: 'widget-1',
    widgetId: 'glances-monitor',
    position: 0,
    enabled: true,
  },
  {
    id: 'widget-2',
    widgetId: 'applications',
    position: 1,
    enabled: true,
  },
  {
    id: 'widget-3',
    widgetId: 'servers-stats',
    position: 2,
    enabled: true,
  },
  {
    id: 'widget-4',
    widgetId: 'virtual-machines-stats',
    position: 3,
    enabled: true,
  },
]

const STORAGE_KEY = 'serverdash-widgets'

export function DraggableDashboard() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(DEFAULT_WIDGETS)
  const [isEditing, setIsEditing] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Load widgets from localStorage on mount
  useEffect(() => {
    try {
      const savedWidgets = localStorage.getItem(STORAGE_KEY)
      if (savedWidgets) {
        const parsed = JSON.parse(savedWidgets)
        setWidgets(parsed)
      }
    } catch (error) {
      console.error('Failed to load widgets from storage:', error)
    }
  }, [])

  // Save widgets to localStorage
  const saveWidgets = (newWidgets: DashboardWidget[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets))
      setHasChanges(false)
      toast.success('Dashboard layout saved')
    } catch (error) {
      console.error('Failed to save widgets to storage:', error)
      toast.error('Failed to save dashboard layout')
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over.id)
        
        const newItems = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          position: index
        }))
        
        setHasChanges(true)
        return newItems
      })
    }
  }

  const handleAddWidget = (widgetId: string) => {
    const newWidget: DashboardWidget = {
      id: `widget-${Date.now()}`,
      widgetId,
      position: widgets.length,
      enabled: true,
    }
    
    setWidgets(prev => [...prev, newWidget])
    setHasChanges(true)
    toast.success('Widget added to dashboard')
  }

  const handleRemoveWidget = (widgetInstanceId: string) => {
    setWidgets(prev => {
      const filtered = prev.filter(w => w.id !== widgetInstanceId)
      // Reorder positions
      return filtered.map((widget, index) => ({
        ...widget,
        position: index
      }))
    })
    setHasChanges(true)
    toast.success('Widget removed from dashboard')
  }

  const handleSave = () => {
    saveWidgets(widgets)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    if (hasChanges) {
      // Reload from storage
      try {
        const savedWidgets = localStorage.getItem(STORAGE_KEY)
        if (savedWidgets) {
          const parsed = JSON.parse(savedWidgets)
          setWidgets(parsed)
        } else {
          setWidgets(DEFAULT_WIDGETS)
        }
        setHasChanges(false)
        toast.info('Changes discarded')
      } catch (error) {
        console.error('Failed to reload widgets:', error)
      }
    }
    setIsEditing(false)
  }

  const existingWidgetIds = widgets.map(w => w.widgetId)

  return (
    <div className="space-y-6">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              Edit Dashboard
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="gap-2"
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
              <Button
                onClick={handleCancelEdit}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {isEditing && (
          <AddWidgetDialog
            onAddWidget={handleAddWidget}
            existingWidgetIds={existingWidgetIds}
          />
        )}
      </div>

      {/* Edit Mode Notice */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">Edit Mode</span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Drag widgets to reorder them or click the × button to remove them. 
            {hasChanges && " You have unsaved changes."}
          </p>
        </div>
      )}

      {/* Widgets Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={widgets.map(w => w.id)} strategy={rectSortingStrategy}>
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
            {widgets.map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                onRemove={handleRemoveWidget}
                isEditing={isEditing}
              >
                <WidgetFactory widgetId={widget.widgetId} config={widget.config} />
              </DraggableWidget>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Empty State */}
      {widgets.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Edit3 className="h-12 w-12 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No widgets on your dashboard</h3>
            <p className="text-sm mt-1">Add some widgets to get started</p>
          </div>
          <AddWidgetDialog
            onAddWidget={handleAddWidget}
            existingWidgetIds={[]}
          />
        </div>
      )}
    </div>
  )
} 