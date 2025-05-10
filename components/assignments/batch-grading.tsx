"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookLoader } from "@/components/animations/book-loader";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { format, isPast } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import { Eye, Search, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";

export function BatchGrading() {
  const { user } = useCurrentUser();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState<any[]>([]);
  const [selectedSubmissions, setSelectedSubmissions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<string | null>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [gradeValue, setGradeValue] = useState<number>(0);
  const [maxPoints, setMaxPoints] = useState<number>(100);
  const [feedbackTemplate, setFeedbackTemplate] = useState("");
  const [tab, setTab] = useState("pending");

  useEffect(() => {
    if (user) {
      fetchCourses();
      fetchSubmissions();
    }
  }, [user, tab]);

  useEffect(() => {
    if (submissions.length > 0) {
      applyFilters();
    }
  }, [submissions, searchQuery, courseFilter]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("id, title, code")
        .eq("instructor_id", user?.id)
        .order("title");

      if (error) throw error;
      setCourses(data || []);
    } catch (err) {
      console.error("Error fetching courses:", err);
      toast({
        title: "Error",
        description: "Failed to load courses",
        variant: "destructive",
      });
    }
  };

  const fetchSubmissions = async () => {
    try {
      setLoading(true);

      // First get courses taught by this teacher
      const { data: teacherCourses, error: coursesError } = await supabase
        .from("courses")
        .select("id")
        .eq("instructor_id", user?.id);

      if (coursesError) throw coursesError;
      if (!teacherCourses || teacherCourses.length === 0) {
        setSubmissions([]);
        setFilteredSubmissions([]);
        return;
      }

      const courseIds = teacherCourses.map((course) => course.id);

      // Get assignments for these courses
      const { data: assignments, error: assignmentsError } = await supabase
        .from("assignments")
        .select(
          `
          id, 
          title, 
          points,
          due_date,
          course_id, 
          courses (
            id, 
            title, 
            code
          )
        `
        )
        .in("course_id", courseIds);

      if (assignmentsError) throw assignmentsError;
      if (!assignments || assignments.length === 0) {
        setSubmissions([]);
        setFilteredSubmissions([]);
        return;
      }

      const assignmentIds = assignments.map((assignment) => assignment.id);

      // Get submissions based on tab selection
      const query = supabase
        .from("submissions")
        .select(
          `
          id, 
          submitted_at,
          grade,
          feedback,
          assignment_id,
          student_id,
          profiles (
            id, 
            first_name, 
            last_name, 
            avatar_url,
            student_id
          )
        `
        )
        .in("assignment_id", assignmentIds);

      // Filter based on the selected tab
      if (tab === "pending") {
        query.is("grade", null);
      } else if (tab === "graded") {
        query.not("grade", "is", null);
      }

      const { data: submissions, error: submissionsError } = await query.order(
        "submitted_at",
        { ascending: false }
      );

      if (submissionsError) throw submissionsError;

      // Combine data
      const submissionsWithDetails =
        submissions?.map((submission) => {
          const assignment = assignments.find(
            (a) => a.id === submission.assignment_id
          );
          return {
            ...submission,
            assignment,
          };
        }) || [];

      setSubmissions(submissionsWithDetails);
      setFilteredSubmissions(submissionsWithDetails);

      // Set max points based on the first submission's assignment (if any)
      if (
        submissionsWithDetails.length > 0 &&
        submissionsWithDetails[0].assignment
      ) {
        setMaxPoints(submissionsWithDetails[0].assignment.points);
      }
    } catch (err) {
      console.error("Error fetching submissions:", err);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...submissions];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (submission) =>
          submission.profiles?.first_name?.toLowerCase().includes(query) ||
          submission.profiles?.last_name?.toLowerCase().includes(query) ||
          submission.assignment?.title?.toLowerCase().includes(query) ||
          submission.assignment?.courses?.code?.toLowerCase().includes(query)
      );
    }

    // Apply course filter
    if (courseFilter) {
      filtered = filtered.filter(
        (submission) => submission.assignment?.course_id === courseFilter
      );
    }

    setFilteredSubmissions(filtered);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSubmissions(
        filteredSubmissions.map((submission) => submission.id)
      );
    } else {
      setSelectedSubmissions([]);
    }
  };

  const handleSelectSubmission = (submissionId: string, checked: boolean) => {
    if (checked) {
      setSelectedSubmissions([...selectedSubmissions, submissionId]);
    } else {
      setSelectedSubmissions(
        selectedSubmissions.filter((id) => id !== submissionId)
      );
    }
  };

  const handleBatchGrade = async () => {
    if (selectedSubmissions.length === 0) return;

    try {
      setSubmitting(true);

      // Get assignment IDs from selected submissions to notify students later
      const selectedSubmissionsData = submissions.filter((submission) =>
        selectedSubmissions.includes(submission.id)
      );

      // Update all selected submissions with the same grade and feedback
      const { error } = await supabase
        .from("submissions")
        .update({
          grade: gradeValue,
          feedback: feedbackTemplate,
          graded_at: new Date().toISOString(),
        })
        .in("id", selectedSubmissions);

      if (error) throw error;

      // Create notifications for students
      for (const submission of selectedSubmissionsData) {
        await supabase.from("notifications").insert({
          user_id: submission.student_id,
          title: "Assignment Graded",
          message: `Your submission for "${submission.assignment.title}" has been graded`,
          type: "grade",
          read: false,
          link: `/dashboard/submissions/${submission.id}`,
          related_id: submission.id,
        });
      }

      toast({
        title: "Batch Grading Complete",
        description: `Successfully graded ${selectedSubmissions.length} submissions`,
      });

      // Reset selections and refresh data
      setSelectedSubmissions([]);
      fetchSubmissions();
    } catch (err) {
      console.error("Error batch grading:", err);
      toast({
        title: "Error",
        description: "Failed to batch grade submissions",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isAllSelected =
    filteredSubmissions.length > 0 &&
    selectedSubmissions.length === filteredSubmissions.length;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <BookLoader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="graded">Graded</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search submissions..."
                className="pl-8 w-[200px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <Select
              value={courseFilter || ""}
              onValueChange={(value) => setCourseFilter(value || null)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code}: {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="pending" className="m-0">
          {selectedSubmissions.length > 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>
                  Batch Grade {selectedSubmissions.length} Submissions
                </CardTitle>
                <CardDescription>
                  Apply the same grade and feedback to all selected submissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grade</label>
                  <div className="flex justify-between">
                    <span>{gradeValue}</span>
                    <span>/ {maxPoints}</span>
                  </div>
                  <Slider
                    value={[gradeValue]}
                    max={maxPoints}
                    step={1}
                    onValueChange={(value) => setGradeValue(value[0])}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Feedback Template
                  </label>
                  <Textarea
                    placeholder="Enter feedback to apply to all selected submissions..."
                    value={feedbackTemplate}
                    onChange={(e) => setFeedbackTemplate(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setSelectedSubmissions([])}
                >
                  Cancel
                </Button>
                <Button onClick={handleBatchGrade} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Grading...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Apply Grades
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          ) : null}

          {filteredSubmissions.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
              <CheckCircle className="h-12 w-12 mx-auto text-primary opacity-20 mb-2" />
              <h3 className="text-lg font-medium mb-1">No submissions found</h3>
              <p className="text-muted-foreground">
                {tab === "pending"
                  ? "All submissions have been graded."
                  : "No submissions match the current filters."}
              </p>
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedSubmissions.includes(submission.id)}
                          onCheckedChange={(checked) =>
                            handleSelectSubmission(
                              submission.id,
                              checked as boolean
                            )
                          }
                          aria-label={`Select submission from ${submission.profiles.first_name} ${submission.profiles.last_name}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {submission.profiles.first_name}{" "}
                          {submission.profiles.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ID: {submission.profiles.student_id}
                        </div>
                      </TableCell>
                      <TableCell>{submission.assignment.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {submission.assignment.courses.code}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(submission.submitted_at),
                          "MMM d, yyyy"
                        )}
                      </TableCell>
                      <TableCell>
                        {submission.grade !== null ? (
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700dark:bg-[#1e1e1c]-green-950/20 dark:text-[#fefaf6]"
                          >
                            Graded: {submission.grade}/
                            {submission.assignment.points}
                          </Badge>
                        ) : isPast(new Date(submission.assignment.due_date)) ? (
                          <Badge
                            variant="outline"
                            className="bg-amber-50 text-amber-700dark:bg-[#1e1e1c]-amber-950/20 dark:text-[#fefaf6]"
                          >
                            Past Due
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/dashboard/assignments/${submission.id}/grade`}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Grade
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="graded" className="m-0">
          {/* Similar table for graded submissions */}
        </TabsContent>

        <TabsContent value="all" className="m-0">
          {/* Similar table for all submissions */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
