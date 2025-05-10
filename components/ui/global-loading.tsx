"use client"

import { useAuth } from "@/hooks/use-auth"
import { motion, AnimatePresence } from "framer-motion"
import { LoadingSpinner } from "./loading-spinner"

export function GlobalLoading() {
  const { globalLoading } = useAuth()

  return (
    <AnimatePresence>
      {globalLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <LoadingSpinner size="lg" text="Loading..." />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
