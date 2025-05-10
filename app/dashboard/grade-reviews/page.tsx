import { PageTitle } from "@/components/page-title"
import { GradeReviewInterface } from "@/components/assignments/grade-review-interface"

export default function GradeReviewsPage() {
  return (
    <div className="space-y-6">
      <PageTitle title="Grade Reviews" description="Manage and respond to grade review requests" />

      <GradeReviewInterface />
    </div>
  )
}
