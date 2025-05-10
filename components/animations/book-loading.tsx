"use client"

import { motion } from "framer-motion"
import { Book } from "lucide-react"

export function BookLoading() {
  return (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        animate={{
          rotateY: [0, 180, 360],
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
        style={{ transformStyle: "preserve-3d" }}
        className="mb-4"
      >
        <Book className="h-16 w-16 text-primary" />
      </motion.div>
    </div>
  )
}
