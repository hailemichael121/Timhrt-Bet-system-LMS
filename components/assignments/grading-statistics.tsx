"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BookOpen, Clock, CheckCircle } from "lucide-react";

interface GradingStatisticsProps {
  pendingCount: number;
  gradedCount: number;
  coursesList: any[];
  selectedCourse: string | null;
  onCourseChange: (courseId: string | null) => void;
}

export function GradingStatistics({
  pendingCount,
  gradedCount,
  coursesList,
  selectedCourse,
  onCourseChange,
}: GradingStatisticsProps) {
  const totalSubmissions = pendingCount + gradedCount;
  const completionPercentage =
    totalSubmissions > 0
      ? Math.round((gradedCount / totalSubmissions) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Grading Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Filter by Course</label>
            <Select
              value={selectedCourse || "all"}
              onValueChange={(value) => onCourseChange(value || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {coursesList.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code}: {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Grading Completion</span>
                <span className="text-sm font-medium">
                  {completionPercentage}%
                </span>
              </div>
              <Progress value={completionPercentage} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center justify-center p-4 bg-amber-50dark:bg-[#1e1e1c]-amber-950/20 rounded-lg">
                <Clock className="h-8 w-8 text-amber-500 mb-2" />
                <span className="text-2xl font-bold">{pendingCount}</span>
                <span className="text-xs text-muted-foreground text-center">
                  Pending
                </span>
              </div>
              <div className="flex flex-col items-center justify-center p-4 bg-green-50dark:bg-[#1e1e1c]-green-950/20 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                <span className="text-2xl font-bold">{gradedCount}</span>
                <span className="text-xs text-muted-foreground text-center">
                  Graded
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center gap-3">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total Submissions</p>
                <p className="text-2xl font-bold">{totalSubmissions}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
