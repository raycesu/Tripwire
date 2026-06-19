"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogBackdrop = ({ className, ...props }: DialogPrimitive.Backdrop.Props) => (
  <DialogPrimitive.Backdrop
    className={cn("tripwire-dialog-backdrop", className)}
    {...props}
  />
)

const DialogViewport = ({ className, ...props }: DialogPrimitive.Viewport.Props) => (
  <DialogPrimitive.Viewport
    className={cn(
      "fixed inset-0 z-[200] flex items-center justify-center overflow-y-auto p-4 sm:p-6",
      className
    )}
    style={{ position: "fixed", inset: 0, zIndex: 200 }}
    {...props}
  />
)

type DialogPopupProps = DialogPrimitive.Popup.Props & {
  opaque?: boolean
}

const DialogPopup = ({ className, opaque = false, ...props }: DialogPopupProps) => (
  <DialogPrimitive.Popup
    className={cn(
      "flex flex-col overflow-hidden rounded-2xl outline-none",
      opaque
        ? "tripwire-add-assets-popup p-4 shadow-none"
        : "glass-popover tripwire-dialog-popup shadow-none",
      className
    )}
    {...props}
  />
)

const DialogTitle = ({ className, ...props }: DialogPrimitive.Title.Props) => (
  <DialogPrimitive.Title
    className={cn("text-silver-label text-sm font-medium tracking-wide uppercase", className)}
    {...props}
  />
)

const DialogDescription = ({ className, ...props }: DialogPrimitive.Description.Props) => (
  <DialogPrimitive.Description
    className={cn("text-sm text-white/55", className)}
    {...props}
  />
)

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogClose,
  DialogBackdrop,
  DialogViewport,
  DialogPopup,
  DialogTitle,
  DialogDescription,
}
