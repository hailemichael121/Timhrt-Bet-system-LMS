"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { supabase } from "@/lib/supabase/client"
import { FileUpload } from "@/components/file-upload"
import { motion } from "framer-motion"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  points: z.coerce.number().min(1, {
    message: "Points must be at least 1.",
  }),
  dueDate: z.date({
    required_error: "Due date is required.",
  }),
})

interface CreateAssignmentFormProps {
  courseId: string
}

export function CreateAssignmentForm({ courseId }: CreateAssignmentFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      points: 100,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)

      // Format the date to ISO string
      const formattedDueDate = values.dueDate.toISOString()

      // Insert assignment into database
      const { data, error } = await supabase
        .from("assignments")
        .insert({
          course_id: courseId,
          title: values.title,
          description: values.description,
          due_date: formattedDueDate,
          points: values.points,
          file_url: fileUrl,
        })
        .select("id")
        .single()

      if (error) throw error

      // Get enrolled students for this course
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select("student_id")
        .eq("course_id", courseId)

      if (enrollmentsError) throw enrollmentsError

      // Create notifications for all enrolled students
      if (enrollments && enrollments.length > 0) {
        const notifications = enrollments.map((enrollment) => ({
          user_id: enrollment.student_id,
          title: "New Assignment",
          message: `A new assignment "${values.title}" has been added to your course`,
          type: "assignment",
          read: false,
          link: `/dashboard/courses/${courseId}`,
          related_id: data.id,
        }))

        const { error: notificationError } = await supabase.from("notifications").insert(notifications)

        if (notificationError) {
          console.error("Error creating notifications:", notificationError)
        }
      }

      toast({
        title: "Assignment created",
        description: `Successfully created ${values.title}`,
      })

      router.push(`/dashboard/courses/${courseId}`)
    } catch (error: any) {
      console.error("Error creating assignment:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to create assignment",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileUploadComplete = (url: string, name: string) => {
    setFileUrl(url)
    setFileName(name)
    toast({
      title: "File attached",
      description: `${name} has been attached to the assignment`,
    })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assignment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Midterm Project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="points"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={1000} {...field} />
                      </FormControl>
                      <FormDescription>Maximum points for this assignment</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground",
                              )}
                            >
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>The deadline for submission</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Provide detailed instructions for the assignment..."
                        className="min-h-32"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Include requirements, guidelines, and submission instructions.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>Attachment (Optional)</FormLabel>
                <FileUpload
                  bucket="assignments"
                  path={`course-${courseId}`}
                  onUploadComplete={handleFileUploadComplete}
                  acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip"
                  maxSizeMB={20}
                />
                {fileName && <p className="text-sm text-muted-foreground mt-2">Attached: {fileName}</p>}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Assignment"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
