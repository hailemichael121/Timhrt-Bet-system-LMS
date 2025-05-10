"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookLoader } from "@/components/animations/book-loader";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { format } from "date-fns";
import { CheckCircle, FileText, ChevronRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface RecentlyGradedListProps {
  courseId: string | null;
}

export function RecentlyGradedList({ courseId }: RecentlyGradedListProps) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [gradedSubmissions, setGradedSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchGradedSubmissions();
    }
  }, [user, courseId]);

  const fetchGradedSubmissions = async () => {
    try {
      setLoading(true);

      // First get courses taught by this teacher
      const { data: courses, error: coursesError } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user?.id)
        .conditionalFilter(courseId !== null, (query) =>
          query.eq("id", courseId)
        );

      if (coursesError) throw coursesError;

      if (!courses || courses.length === 0) {
        setGradedSubmissions([]);
        return;
      }

      const courseIds = courses.map((course) => course.id);

      // Get assignments for these courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select("id, title, due_date, course_id, courses(id, title, code)")
        .in("course_id", courseIds);

      if (assignmentsError) throw assignmentsError;

      if (!assignments || assignments.length === 0) {
        setGradedSubmissions([]);
        return;
      }

      const assignmentIds = assignments.map((assignment) => assignment.id);

      // Get submissions that have been graded
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(
          `
          id, 
          submitted_at,
          graded_at,
          grade,
          assignment_id,
          student_id,
          profiles(id, first_name, last_name, avatar_url, student_id)
        `
        )
        .in("assignment_id", assignmentIds)
        .not("grade", "is", null)
        .order("graded_at", { ascending: false })
        .limit(10);

      if (submissionsError) throw submissionsError;

      // Combine data
      const gradedData =
        submissions?.map((submission) => {
          const assignment = assignments.find(
            (a) => a.id === submission.assignment_id
          );
          return {
            ...submission,
            assignment,
          };
        }) || [];

      setGradedSubmissions(gradedData);
    } catch (err) {
      console.error("Error fetching graded submissions:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BookLoader />
      </div>
    );
  }

  if (gradedSubmissions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <FileText className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-1">No graded submissions</h3>
        <p className="text-muted-foreground">
          You haven't graded any submissions yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {gradedSubmissions.map((submission, index) => (
        <motion.div
          key={submission.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <Card>
            <CardContent className="p-0">
              <div className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={submission.profiles.avatar_url || "/placeholder.svg"}
                    />
                    <AvatarFallback>
                      {submission.profiles.first_name?.[0] || ""}
                      {submission.profiles.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium">
                      {submission.profiles.first_name}{" "}
                      {submission.profiles.last_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {submission.assignment.courses.code}:{" "}
                      {submission.assignment.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant="outline"
                        className="bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Grade: {submission.grade}/{submission.assignment.points}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Graded {format(new Date(submission.graded_at), "MMM d")}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button variant="outline" asChild>
                    <Link
                      href={`/dashboard/assignments/${submission.id}/grade`}
                    >
                      Review
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
