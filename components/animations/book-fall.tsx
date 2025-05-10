"use client"

import { motion } from "framer-motion"
import { BookX } from "lucide-react"

export function BookFall() {
  return (
    <div className="flex items-center justify-center">
      <motion.div
        initial={{ y: -100, rotate: 0, opacity: 0 }}
        animate={{ y: 0, rotate: [0, 15, 0], opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 10,
          duration: 1,
        }}
      >
        <BookX className="h-24 w-24 text-primary" />
      </motion.div>
    </div>
  )
}
