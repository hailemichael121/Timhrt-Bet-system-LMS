"use client"

import { Button } from "@/components/ui/button"
import { BookLocked } from "@/components/animations/book-locked"
import Link from "next/link"
import { motion } from "framer-motion"

export default function Forbidden() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="mb-8">
        <BookLocked />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold mb-2">403</h1>
        <h2 className="text-2xl font-semibold mb-4">Access Forbidden</h2>
        <p className="text-muted-foreground text-center max-w-md mb-8">
          You don't have permission to access this page. Please contact your administrator if you believe this is an
          error.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </motion.div>
    </div>
  )
}
