'use client'

import * as React from "react"
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { motion } from "framer-motion"
import { GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"

interface DragDropItem {
  id: string
  content: React.ReactNode
}

interface DragDropListProps {
  items: DragDropItem[]
  onReorder: (startIndex: number, endIndex: number) => void
  className?: string
  itemClassName?: string
  dragHandleClassName?: string
}

export function DragDropList({
  items,
  onReorder,
  className,
  itemClassName,
  dragHandleClassName
}: DragDropListProps) {
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    
    const { source, destination } = result
    if (source.index !== destination.index) {
      onReorder(source.index, destination.index)
    }
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="drag-drop-list">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={cn(
              "space-y-4",
              snapshot.isDraggingOver && "bg-blue-50/50 rounded-lg p-2",
              className
            )}
          >
            {items.map((item, index) => (
              <Draggable key={item.id} draggableId={item.id} index={index}>
                {(provided, snapshot) => (
                  <motion.div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    layout
                    className={cn(
                      "group relative bg-white border border-gray-200 rounded-lg transition-all duration-200",
                      snapshot.isDragging 
                        ? "shadow-lg border-blue-300 bg-blue-50/30 rotate-2 scale-105" 
                        : "hover:shadow-md hover:border-gray-300",
                      itemClassName
                    )}
                  >
                    <div
                      {...provided.dragHandleProps}
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10",
                        snapshot.isDragging && "opacity-100",
                        dragHandleClassName
                      )}
                    >
                      <GripVertical className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </div>
                    
                    <div className="pl-8">
                      {item.content}
                    </div>
                  </motion.div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

// Utility hook for managing drag-and-drop arrays
export function useDragDropList<T>(
  initialItems: T[],
  keyExtractor: (item: T, index: number) => string
) {
  const [items, setItems] = React.useState<T[]>(initialItems)

  React.useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  const reorder = React.useCallback((startIndex: number, endIndex: number) => {
    setItems(prevItems => {
      const result = Array.from(prevItems)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)
      return result
    })
  }, [])

  const getDragDropItems = React.useCallback(
    (renderContent: (item: T, index: number) => React.ReactNode): DragDropItem[] => {
      return items.map((item, index) => ({
        id: keyExtractor(item, index),
        content: renderContent(item, index)
      }))
    },
    [items, keyExtractor]
  )

  return {
    items,
    setItems,
    reorder,
    getDragDropItems
  }
}