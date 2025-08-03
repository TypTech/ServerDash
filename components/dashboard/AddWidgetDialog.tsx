"use client"

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { getAvailableWidgets, WidgetConfig, WIDGET_CATEGORIES } from '@/lib/widget-registry'

interface AddWidgetDialogProps {
  onAddWidget: (widgetId: string) => void
  existingWidgetIds: string[]
}

export function AddWidgetDialog({ onAddWidget, existingWidgetIds }: AddWidgetDialogProps) {
  const [open, setOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  const availableWidgets = getAvailableWidgets()
  const availableToAdd = availableWidgets.filter(widget => 
    !existingWidgetIds.includes(widget.id)
  )

  const categories = Object.keys(WIDGET_CATEGORIES)
  const filteredWidgets = selectedCategory 
    ? availableToAdd.filter(widget => widget.category === selectedCategory)
    : availableToAdd

  const handleAddWidget = (widget: WidgetConfig) => {
    onAddWidget(widget.id)
    setOpen(false)
  }

  return (
    <>
      <Button size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        Add Widget
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Widget to Dashboard</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Categories</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(null)}
              >
                All
              </Button>
              {categories.map((category) => {
                const categoryConfig = WIDGET_CATEGORIES[category as keyof typeof WIDGET_CATEGORIES]
                return (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="gap-2"
                  >
                    <categoryConfig.icon className="h-4 w-4" />
                    {categoryConfig.name}
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Widget Grid */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Available Widgets</h4>
            {filteredWidgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {availableToAdd.length === 0 
                  ? "All widgets are already added to your dashboard" 
                  : "No widgets found in this category"
                }
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {filteredWidgets.map((widget) => (
                  <div
                    key={widget.id}
                    className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleAddWidget(widget)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted">
                        <widget.icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-sm">{widget.name}</h5>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {widget.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {WIDGET_CATEGORIES[widget.category as keyof typeof WIDGET_CATEGORIES]?.name}
                          </Badge>
                          {widget.defaultSize.cols === 2 && (
                            <Badge variant="outline" className="text-xs">
                              Full Width
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
} 