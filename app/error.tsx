"use client"

import { Button } from "@/components/ui/button"
import { BookFall } from "@/components/animations/book-fall"
import { useEffect } from "react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="h-64 w-64 mb-8">
        <BookFall />
      </div>
      <h1 className="text-4xl font-bold mb-2">Something went wrong!</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        We apologize for the inconvenience. Please try again later or contact support if the problem persists.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
