"use client"

import { motion } from "framer-motion"
import { BookLock } from "lucide-react"

export function BookLocked() {
  return (
    <div className="relative w-48 h-48">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="relative">
          <motion.div
            className="absolute -inset-4 rounded-full bg-red-500/10"
            initial={{ scale: 0 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={{
              duration: 2,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
          <BookLock className="h-24 w-24 text-red-500" />
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-8 left-0 right-0 text-center text-lg font-medium text-red-500"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        Access Forbidden
      </motion.div>
    </div>
  )
}
