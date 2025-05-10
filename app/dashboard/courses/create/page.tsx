import { CreateCourseForm } from "@/components/courses/create-course-form"
import { PageTitle } from "@/components/page-title"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateCoursePage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/courses">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <PageTitle title="Create Course" description="Add a new course to the system" />
      </div>

      <CreateCourseForm />
    </div>
  )
}
