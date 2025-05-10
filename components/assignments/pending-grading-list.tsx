"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BookLoader } from "@/components/animations/book-loader";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { format, isPast, isToday } from "date-fns";
import { Clock, FileText, ChevronRight, CheckCircle } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface PendingGradingListProps {
  courseId: string | null;
  onGraded?: () => void;
}

export function PendingGradingList({
  courseId,
  onGraded,
}: PendingGradingListProps) {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchPendingSubmissions();
    }
  }, [user, courseId]);

  const fetchPendingSubmissions = async () => {
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
        setPendingSubmissions([]);
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
        setPendingSubmissions([]);
        return;
      }

      const assignmentIds = assignments.map((assignment) => assignment.id);

      // Get submissions that need grading
      const { data: submissions, error: submissionsError } = await supabase
        .from("submissions")
        .select(
          `
          id, 
          submitted_at,
          assignment_id,
          student_id,
          profiles(id, first_name, last_name, avatar_url, student_id)
        `
        )
        .in("assignment_id", assignmentIds)
        .is("grade", null)
        .order("submitted_at", { ascending: false });

      if (submissionsError) throw submissionsError;

      // Combine data
      const pendingData =
        submissions?.map((submission) => {
          const assignment = assignments.find(
            (a) => a.id === submission.assignment_id
          );
          return {
            ...submission,
            assignment,
          };
        }) || [];

      setPendingSubmissions(pendingData);
    } catch (err) {
      console.error("Error fetching pending submissions:", err);
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

  if (pendingSubmissions.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg bg-muted/20">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-primary/10 p-3">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h3 className="text-lg font-medium mb-1">All caught up!</h3>
        <p className="text-muted-foreground">
          There are no pending submissions to grade.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingSubmissions.map((submission, index) => (
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
                      <Badge variant="outline" className="text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        Submission
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          isPast(new Date(submission.assignment.due_date)) &&
                          !isToday(new Date(submission.assignment.due_date))
                            ? "bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        Due{" "}
                        {format(
                          new Date(submission.assignment.due_date),
                          "MMM d, yyyy"
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-center">
                  <div className="text-sm text-muted-foreground hidden sm:block">
                    Submitted{" "}
                    {format(new Date(submission.submitted_at), "MMM d, yyyy")}
                  </div>
                  <Button asChild>
                    <Link
                      href={`/dashboard/assignments/${submission.id}/grade`}
                    >
                      Grade
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
