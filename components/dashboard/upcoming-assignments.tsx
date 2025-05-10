"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/hooks/use-current-user";
import { mockAssignments, mockCourses } from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export function UpcomingAssignments() {
  const { user } = useCurrentUser();

  // Filter assignments based on user role
  const filteredAssignments =
    user?.role === "student"
      ? mockAssignments.filter((assignment) =>
          mockCourses.some(
            (course) =>
              course.enrolledStudents.includes(user.id) &&
              course.id === assignment.courseId
          )
        )
      : mockAssignments;

  // Sort by due date
  const sortedAssignments = [...filteredAssignments]
    .sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )
    .slice(0, 5);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Upcoming Assignments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedAssignments.length > 0 ? (
            sortedAssignments.map((assignment) => {
              const course = mockCourses.find(
                (c) => c.id === assignment.courseId
              );
              return (
                <div
                  key={assignment.id}
                  className="flex items-start justify-between"
                >
                  <div className="grid gap-1">
                    <Link
                      href={`/dashboard/courses/${assignment.courseId}`}
                      className="font-medium hover:underline"
                    >
                      {assignment.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {course?.title}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Due {formatDate(assignment.dueDate)}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">
              No upcoming assignments
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
