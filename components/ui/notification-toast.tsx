"use client"

import { useEffect } from "react"
import { toast } from "@/components/ui/use-toast"
import { CheckCircle, AlertCircle, Info } from "lucide-react"
import { motion } from "framer-motion"

interface NotificationToastProps {
  title: string
  message: string
  type: "success" | "error" | "info"
  duration?: number
  onClose?: () => void
}

export function NotificationToast({ title, message, type = "info", duration = 5000, onClose }: NotificationToastProps) {
  useEffect(() => {
    const icon =
      type === "success" ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : type === "error" ? (
        <AlertCircle className="h-5 w-5 text-red-500" />
      ) : (
        <Info className="h-5 w-5 text-blue-500" />
      )

    toast({
      title: (
        <div className="flex items-center gap-2">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {icon}
          </motion.div>
          <span>{title}</span>
        </div>
      ),
      description: message,
      duration: duration,
      onOpenChange: (open) => {
        if (!open && onClose) {
          onClose()
        }
      },
      variant: type === "error" ? "destructive" : "default",
      className:
        type === "success"
          ? "border-green-500 border-l-4"
          : type === "error"
            ? "border-red-500 border-l-4"
            : "border-blue-500 border-l-4",
    })
  }, [title, message, type, duration, onClose])

  return null
}
