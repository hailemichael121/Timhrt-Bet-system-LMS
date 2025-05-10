import { CoursesList } from "@/components/courses/courses-list"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"

export default function CoursesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <PageTitle title="Courses" description="Manage your courses and enrollments" />
        <Link href="/dashboard/courses/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Course
          </Button>
        </Link>
      </div>

      <CoursesList />
    </div>
  )
}
