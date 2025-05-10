"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { BookOpen, BookText, GraduationCap, Award } from "lucide-react"

export function BookStackAnimation() {
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Start animation after component mounts
    setIsAnimating(true)

    // Set up interval to restart animation
    const interval = setInterval(() => {
      setIsAnimating(false)
      setTimeout(() => setIsAnimating(true), 100)
    }, 10000) // Restart every 10 seconds

    return () => clearInterval(interval)
  }, [])

  const books = [
    { icon: BookOpen, color: "text-blue-500", delay: 0 },
    { icon: BookText, color: "text-green-500", delay: 0.2 },
    { icon: GraduationCap, color: "text-purple-500", delay: 0.4 },
    { icon: Award, color: "text-amber-500", delay: 0.6 },
  ]

  return (
    <div className="relative h-40 w-40 mx-auto">
      {books.map((book, index) => {
        const Icon = book.icon
        return (
          <motion.div
            key={index}
            className={`absolute left-0 right-0 mx-auto ${book.color}`}
            initial={{ y: 0, opacity: 0, scale: 0.8, rotateY: 0 }}
            animate={
              isAnimating
                ? {
                    y: [0, -20 * (books.length - index), 0],
                    opacity: [0, 1, 1, 0],
                    scale: [0.8, 1, 1, 0.8],
                    rotateY: [0, 360, 720],
                    zIndex: [1, books.length - index, books.length - index, 1],
                  }
                : {}
            }
            transition={{
              duration: 4,
              delay: book.delay,
              ease: "easeInOut",
              times: [0, 0.3, 0.7, 1],
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 1,
            }}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "center center",
            }}
          >
            <div className="relative">
              <div
                className="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-lg"
                style={{
                  transform: "translateZ(-10px)",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1), 0 1px 3px rgba(0,0,0,0.08)",
                }}
              ></div>
              <div className="h-20 w-20 bg-card border rounded-lg shadow-lg flex items-center justify-center">
                <Icon className="h-10 w-10" />
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Reflection */}
      <div
        className="absolute bottom-0 left-0 right-0 mx-auto h-10 w-20 rounded-full bg-black/5 blur-md"
        style={{ transform: "rotateX(60deg) scale(1, 0.5)" }}
      ></div>
    </div>
  )
}
