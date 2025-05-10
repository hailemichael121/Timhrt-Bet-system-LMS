import { PageTitle } from "@/components/page-title"
import { BatchGrading } from "@/components/assignments/batch-grading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GradeExport } from "@/components/assignments/grade-export"
import { RubricGrading } from "@/components/assignments/rubric-grading"

export default function TeacherGradingPage() {
  return (
    <div className="space-y-6">
      <PageTitle
        title="Teacher Grading Center"
        description="Grade assignments, manage rubrics, and export student performance data"
      />

      <Tabs defaultValue="batch" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="batch">Batch Grading</TabsTrigger>
          <TabsTrigger value="rubrics">Rubric Grading</TabsTrigger>
          <TabsTrigger value="export">Export Grades</TabsTrigger>
        </TabsList>

        <TabsContent value="batch" className="space-y-6">
          <BatchGrading />
        </TabsContent>

        <TabsContent value="rubrics" className="space-y-6">
          <RubricGrading />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <GradeExport />
        </TabsContent>
      </Tabs>
    </div>
  )
}
