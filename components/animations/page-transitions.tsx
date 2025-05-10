"use client"

import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface PageTransitionProps {
  children: ReactNode
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "0%" }}
        exit={{ x: "-100%" }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  )
}

export function BookPageTransition({ children }: PageTransitionProps) {
  return (
    <div className="relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, rotateY: -20 }}
        animate={{ opacity: 1, rotateY: 0 }}
        exit={{ opacity: 0, rotateY: 20 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        style={{ perspective: "1000px" }}
        className="relative"
      >
        {children}
      </motion.div>
    </div>
  )
}
