"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { motion } from "framer-motion";

interface GradingSidebarProps {
  submissionId: string;
  assignmentId: string;
  studentId: string;
  initialGrade?: number;
  initialFeedback?: string;
  maxPoints: number;
  onGradeSubmit?: () => void;
}

export function GradingSidebar({
  submissionId,
  assignmentId,
  studentId,
  initialGrade = 0,
  initialFeedback = "",
  maxPoints,
  onGradeSubmit,
}: GradingSidebarProps) {
  const [grade, setGrade] = useState<number>(initialGrade);
  const [feedback, setFeedback] = useState<string>(initialFeedback);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    setGrade(initialGrade);
    setFeedback(initialFeedback);
  }, [initialGrade, initialFeedback]);

  const handleGradeSubmit = async () => {
    try {
      setSubmitting(true);
      setError(null);
      setSuccess(false);

      // Update submission with grade and feedback
      const { error } = await supabase
        .from("submissions")
        .update({
          grade,
          feedback,
          graded_at: new Date().toISOString(),
          needs_review: true, // Mark for admin review
        })
        .eq("id", submissionId);

      if (error) throw error;

      // Create notification for the student
      await supabase.from("notifications").insert({
        user_id: studentId,
        title: "Assignment Graded",
        message: `Your submission has been graded with ${grade}/${maxPoints} points`,
        type: "grade",
        read: false,
        link: `/dashboard/submissions/${submissionId}`,
        related_id: submissionId,
      });

      // Create notification for admin
      const { data: admins, error: adminsError } = await supabase
        .from("profiles")
        .select("id")
        .eq("role", "admin");

      if (!adminsError && admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            title: "Grade Needs Review",
            message: `A grade for assignment ${assignmentId} needs your review`,
            type: "grade_review",
            read: false,
            link: `/dashboard/admin/grades/${submissionId}`,
            related_id: submissionId,
          });
        }
      }

      setSuccess(true);
      toast({
        title: "Grade Submitted",
        description: "The grade and feedback have been submitted successfully",
      });

      if (onGradeSubmit) {
        onGradeSubmit();
      }
    } catch (err) {
      console.error("Error submitting grade:", err);
      setError("Failed to submit grade. Please try again.");
      toast({
        title: "Error",
        description: "Failed to submit grade",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle>Grade Submission</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium">Grade</label>
              <span className="text-sm font-medium">
                {grade} / {maxPoints}
              </span>
            </div>
            <Slider
              value={[grade]}
              max={maxPoints}
              step={1}
              onValueChange={(value) => setGrade(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{maxPoints}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Percentage</label>
            <div className="text-2xl font-bold">
              {maxPoints > 0 ? Math.round((grade / maxPoints) * 100) : 0}%
            </div>
            <div className="w-full h-2 rounded-full bg-gray-200dark:bg-[#1e1e1c]-gray-700 overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{
                  width: `${maxPoints > 0 ? (grade / maxPoints) * 100 : 0}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Feedback</label>
            <Textarea
              placeholder="Provide detailed feedback on the submission..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-32"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-green-600 dark:text-[#fefaf6] text-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Grade submitted successfully</span>
            </div>
          )}

          <Button
            onClick={handleGradeSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Grade"
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
