"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
  className?: string
}

export function LoadingSpinner({ size = "md", text, className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
      >
        <Loader2 className={cn("text-primary", sizeClasses[size])} />
      </motion.div>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  )
}
