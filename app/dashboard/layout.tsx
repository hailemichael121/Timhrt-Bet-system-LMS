import type React from "react"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { DashboardHeader } from "@/components/dashboard/header"
import { PageTransition } from "@/components/page-transition"
// Import the PageLoading component
import { PageLoading } from "@/components/ui/page-loading"
import { Suspense } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Update the return statement to include Suspense and PageLoading
  return (
    <PageTransition>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader />
        <div className="flex flex-1 overflow-hidden">
          <DashboardSidebar />
          <main className="flex-1 overflow-auto p-6 md:p-8 pt-6">
            <Suspense fallback={<PageLoading />}>{children}</Suspense>
          </main>
        </div>
      </div>
    </PageTransition>
  )
}
