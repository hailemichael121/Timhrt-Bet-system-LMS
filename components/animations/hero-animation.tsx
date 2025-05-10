"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { BookOpen, GraduationCap, Users, BarChart, CheckCircle, FileText } from "lucide-react"

export function HeroAnimation() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const icons = [BookOpen, GraduationCap, Users, BarChart, CheckCircle, FileText]
  const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-amber-500", "bg-pink-500", "bg-cyan-500"]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % icons.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [icons.length])

  const Icon = icons[currentIndex]
  const color = colors[currentIndex]

  return (
    <div className="relative w-full max-w-md aspect-square">
      {/* Background elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 rounded-full bg-primary/5 animate-pulse"></div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-48 h-48 rounded-full border-4 border-dashed border-primary/20 animate-spin-slow"></div>
      </div>

      {/* Floating books */}
      <motion.div
        className="absolute top-10 left-10"
        animate={{
          y: [0, -10, 0],
          rotate: [0, 5, 0],
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
        }}
      >
        <div className="w-16 h-20 bg-primary/10 rounded-md flex items-center justify-center">
          <BookOpen className="h-8 w-8 text-primary" />
        </div>
      </motion.div>

      <motion.div
        className="absolute bottom-10 right-10"
        animate={{
          y: [0, 10, 0],
          rotate: [0, -5, 0],
        }}
        transition={{
          duration: 3.5,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 0.5,
        }}
      >
        <div className="w-16 h-20 bg-primary/10 rounded-md flex items-center justify-center">
          <FileText className="h-8 w-8 text-primary" />
        </div>
      </motion.div>

      <motion.div
        className="absolute top-1/2 right-8 transform -translate-y-1/2"
        animate={{
          x: [0, 10, 0],
          rotate: [0, 3, 0],
        }}
        transition={{
          duration: 3,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 1,
        }}
      >
        <div className="w-16 h-20 bg-primary/10 rounded-md flex items-center justify-center">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
      </motion.div>

      {/* Central icon that changes */}
      <div className="absolute inset-0 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className={`w-24 h-24 rounded-full ${color} flex items-center justify-center shadow-lg`}
          >
            <Icon className="h-12 w-12 text-white" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Orbiting elements */}
      <div className="absolute inset-0">
        <div className="w-full h-full relative">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              className="absolute w-6 h-6 rounded-full bg-primary/20"
              animate={{
                x: [Math.cos((i / 6) * Math.PI * 2) * 100, Math.cos(((i + 1) / 6) * Math.PI * 2) * 100],
                y: [Math.sin((i / 6) * Math.PI * 2) * 100, Math.sin(((i + 1) / 6) * Math.PI * 2) * 100],
              }}
              transition={{
                duration: 10,
                repeat: Number.POSITIVE_INFINITY,
                ease: "linear",
                delay: i * 0.5,
              }}
              style={{
                top: "50%",
                left: "50%",
                translateX: "-50%",
                translateY: "-50%",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
