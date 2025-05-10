"use client"

import { LoadingSpinner } from "./loading-spinner"
import { motion } from "framer-motion"

export function PageLoading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[400px] items-center justify-center"
    >
      <LoadingSpinner size="lg" text="Loading..." />
    </motion.div>
  )
}
