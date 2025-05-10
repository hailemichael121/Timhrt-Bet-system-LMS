"use client"

import { motion } from "framer-motion"
import { BookOpen } from "lucide-react"

export function BookPageTurn() {
  return (
    <div className="relative w-48 h-48">
      <motion.div
        className="absolute inset-0 bg-primary/10 rounded-lg"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 360 }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
        }}
        style={{ transformStyle: "preserve-3d", perspective: "1000px" }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-16 w-16 text-primary" />
        </div>
      </motion.div>

      {/* Page turning effect */}
      <motion.div
        className="absolute inset-0 bg-background rounded-lg shadow-md"
        initial={{ rotateY: 0 }}
        animate={{ rotateY: 180 }}
        transition={{
          duration: 1.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: [0.4, 0, 0.6, 1],
          repeatDelay: 0.5,
        }}
        style={{
          transformStyle: "preserve-3d",
          perspective: "1000px",
          transformOrigin: "left center",
          backfaceVisibility: "hidden",
        }}
      />

      <motion.div
        className="absolute bottom-0 left-0 right-0 text-center text-sm font-medium text-muted-foreground"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        Loading...
      </motion.div>
    </div>
  )
}
