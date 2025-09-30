"use client"

import * as React from "react"
import { GripVertical } from "lucide-react"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

type ResizablePanelGroupProps = React.ComponentProps<"div"> & {
  direction: "horizontal" | "vertical"
}

const ResizablePanelGroupContext = React.createContext<{
  direction: "horizontal" | "vertical"
  id: string
} | null>(null)

const ResizablePanelGroup = React.forwardRef<
  HTMLDivElement,
  ResizablePanelGroupProps
>(({ className, direction, children, ...props }, ref) => {
  const id = React.useId()

  return (
    <ResizablePanelGroupContext.Provider value={{ direction, id }}>
      <div
        ref={ref}
        data-panel-group-id={id}
        className={cn(
          "flex h-full w-full data-[panel-group-direction=vertical]:flex-col",
          className
        )}
        data-panel-group-direction={direction}
        {...props}
      >
        {children}
      </div>
    </ResizablePanelGroupContext.Provider>
  )
})

ResizablePanelGroup.displayName = "ResizablePanelGroup"

const ResizablePanel = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "relative flex h-full w-full",
        "[&[data-panel-group-direction=vertical]>div]:flex-col",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})
ResizablePanel.displayName = "ResizablePanel"

const ResizableHandle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { withHandle?: boolean }
>(({ className, withHandle, ...props }, ref) => {
  const groupContext = React.useContext(ResizablePanelGroupContext)

  if (!groupContext) {
    throw new Error(
      "ResizableHandle must be used within a ResizablePanelGroup"
    )
  }
  const { direction } = groupContext

  return (
    <button
      ref={ref}
      data-panel-group-direction={direction}
      className={cn(
        "relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
          <GripVertical className="h-2.5 w-2.5" />
        </div>
      )}
    </button>
  )
})
ResizableHandle.displayName = "ResizableHandle"

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }