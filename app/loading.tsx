import { BookPageTurn } from "@/components/animations/book-page-turn"

export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <BookPageTurn />
      <p className="text-muted-foreground mt-8">Loading content...</p>
    </div>
  )
}
