"use client"

import { motion } from "framer-motion"
import { BookX } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface BookErrorProps {
  title?: string
  message?: string
  reset?: () => void
}

export function BookError({
  title = "Something went wrong",
  message = "We couldn't find the page you were looking for",
  reset,
}: BookErrorProps) {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center">
      <motion.div
        className="relative mb-8 h-32 w-32"
        initial={{ y: -50, rotateZ: 0 }}
        animate={{ y: 0, rotateZ: [0, -10, 10, -10, 0] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            rotateY: [0, 15, 0, -15, 0],
            y: [0, -5, 0, -5, 0],
          }}
          transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY }}
        >
          <div className="relative h-32 w-32">
            {/* Falling books animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              <BookX className="h-20 w-20 text-destructive/80" />
            </div>
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute h-4 w-20 rounded bg-destructive/20"
                initial={{ top: -20, left: "30%", rotate: (i - 2) * 10 }}
                animate={{ top: ["0%", "100%"], rotate: [(i - 2) * 10, (i - 2) * 30] }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.2,
                  repeatDelay: 3,
                  ease: "easeIn",
                }}
                style={{ zIndex: 5 - i }}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="mb-2 text-2xl font-bold text-destructive">{title}</h2>
        <p className="mb-6 text-muted-foreground">{message}</p>
        <div className="flex gap-4 justify-center">
          {reset && (
            <Button onClick={reset} variant="outline">
              Try again
            </Button>
          )}
          <Button asChild>
            <Link href="/">Go back home</Link>
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
