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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileUpload } from "@/components/file-upload"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { useState } from "react"
import { Loader2, FileText, Calendar, Info } from "lucide-react"
import { motion } from "framer-motion"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const formSchema = z.object({
  title: z.string().min(5, {
    message: "Title must be at least 5 characters.",
  }),
  code: z.string().min(2, {
    message: "Course code is required.",
  }),
  department: z.string().min(2, {
    message: "Department is required.",
  }),
  credits: z.coerce.number().min(1, {
    message: "Credits must be at least 1.",
  }),
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  semester: z.string().min(1, {
    message: "Semester is required.",
  }),
  year: z.string().min(1, {
    message: "Year is required.",
  }),
  schedule: z.string().optional(),
  location: z.string().optional(),
  capacity: z.coerce.number().min(1).optional(),
  prerequisites: z.string().optional(),
  objectives: z.string().optional(),
})

export function CreateCourseForm() {
  const router = useRouter()
  const { user } = useCurrentUser()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState("basic")
  const [syllabus, setSyllabus] = useState<{ url: string; name: string } | null>(null)
  const [materials, setMaterials] = useState<Array<{ url: string; name: string; type: string }>>([])

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      code: "",
      department: "",
      credits: 3,
      description: "",
      semester: "",
      year: new Date().getFullYear().toString(),
      schedule: "",
      location: "",
      capacity: 30,
      prerequisites: "",
      objectives: "",
    },
  })

  const handleSyllabusUpload = (url: string, name: string) => {
    setSyllabus({ url, name })
    toast({
      title: "Syllabus uploaded",
      description: `${name} has been uploaded successfully.`,
    })
  }

  const handleMaterialUpload = (url: string, name: string) => {
    const fileExtension = name.split(".").pop()?.toLowerCase() || ""
    let type = "document"

    if (["jpg", "jpeg", "png", "gif", "svg", "webp"].includes(fileExtension)) {
      type = "image"
    } else if (["mp4", "webm", "ogg", "mov"].includes(fileExtension)) {
      type = "video"
    } else if (["mp3", "wav", "ogg"].includes(fileExtension)) {
      type = "audio"
    } else if (["pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx"].includes(fileExtension)) {
      type = "document"
    }

    setMaterials((prev) => [...prev, { url, name, type }])
    toast({
      title: "Material uploaded",
      description: `${name} has been uploaded successfully.`,
    })
  }

  const removeMaterial = (index: number) => {
    setMaterials((prev) => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) return

    try {
      setIsSubmitting(true)

      // Insert course into database
      const { data, error } = await supabase
        .from("courses")
        .insert({
          title: values.title,
          code: values.code,
          department: values.department,
          credits: values.credits,
          description: values.description,
          instructor_id: user.id,
          semester: values.semester,
          year: values.year,
          schedule: values.schedule,
          location: values.location,
          capacity: values.capacity,
          prerequisites: values.prerequisites,
          objectives: values.objectives,
          syllabus_url: syllabus?.url,
          syllabus_name: syllabus?.name,
        })
        .select()
        .single()

      if (error) throw error

      // Insert course materials
      if (materials.length > 0) {
        const materialsToInsert = materials.map((material) => ({
          course_id: data.id,
          url: material.url,
          name: material.name,
          type: material.type,
        }))

        const { error: materialsError } = await supabase.from("course_materials").insert(materialsToInsert)

        if (materialsError) {
          console.error("Error adding course materials:", materialsError)
          // Continue anyway, just log the error
        }
      }

      // Create notification for admin
      const { data: admins, error: adminsError } = await supabase.from("profiles").select("id").eq("role", "admin")

      if (!adminsError && admins) {
        for (const admin of admins) {
          await supabase.from("notifications").insert({
            user_id: admin.id,
            title: "New Course Created",
            message: `A new course "${values.title}" (${values.code}) has been created and needs review.`,
            type: "course_created",
            read: false,
            link: `/dashboard/courses/${data.id}`,
            related_id: data.id,
          })
        }
      }

      toast({
        title: "Course created",
        description: `Successfully created ${values.title}`,
      })

      router.push("/dashboard/courses")
    } catch (error: any) {
      console.error("Error creating course:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextTab = () => {
    if (activeTab === "basic") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("materials")
  }

  const prevTab = () => {
    if (activeTab === "materials") setActiveTab("details")
    else if (activeTab === "details") setActiveTab("basic")
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          <CardDescription>Fill in the details to create a new course for your students</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic" className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>Basic Info</span>
                  </TabsTrigger>
                  <TabsTrigger value="details" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="materials" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Materials</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-6 pt-4">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Introduction to Computer Science" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Code</FormLabel>
                          <FormControl>
                            <Input placeholder="CS101" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input placeholder="Computer Science" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="credits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credits</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} max={6} {...field} />
                          </FormControl>
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
                            placeholder="A comprehensive introduction to the fundamental principles of computer science..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a detailed description of the course content and objectives.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="button" onClick={nextTab}>
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="details" className="space-y-6 pt-4">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="semester"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Semester</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select semester" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Fall">Fall</SelectItem>
                              <SelectItem value="Spring">Spring</SelectItem>
                              <SelectItem value="Summer">Summer</SelectItem>
                              <SelectItem value="Winter">Winter</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="year"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[...Array(5)].map((_, i) => {
                                const year = new Date().getFullYear() + i
                                return (
                                  <SelectItem key={year} value={year.toString()}>
                                    {year}
                                  </SelectItem>
                                )
                              })}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="schedule"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Schedule</FormLabel>
                          <FormControl>
                            <Input placeholder="Mon, Wed, Fri 10:00 AM - 11:30 AM" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input placeholder="Room 101, Science Building" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="capacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Capacity</FormLabel>
                          <FormControl>
                            <Input type="number" min={1} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="prerequisites"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prerequisites</FormLabel>
                          <FormControl>
                            <Input placeholder="None" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="objectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Objectives</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="By the end of this course, students will be able to..."
                            className="min-h-32"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Previous
                    </Button>
                    <Button type="button" onClick={nextTab}>
                      Next
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="materials" className="space-y-6 pt-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">Course Syllabus</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload a syllabus document for your course (PDF recommended)
                      </p>
                      <FileUpload
                        bucket="courses"
                        path={`syllabus/${form.getValues("code")}`}
                        onUploadComplete={handleSyllabusUpload}
                        acceptedFileTypes=".pdf,.doc,.docx"
                        maxSizeMB={10}
                      />
                      {syllabus && (
                        <div className="mt-2 p-2 border rounded flex items-center justify-between">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 mr-2 text-primary" />
                            <span className="text-sm">{syllabus.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => setSyllabus(null)} className="h-8 w-8 p-0">
                            &times;
                          </Button>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg font-medium">Course Materials</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload additional materials for your course (documents, presentations, videos, etc.)
                      </p>
                      <FileUpload
                        bucket="courses"
                        path={`materials/${form.getValues("code")}`}
                        onUploadComplete={handleMaterialUpload}
                        acceptedFileTypes=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.mp4,.mp3"
                        maxSizeMB={50}
                      />
                      {materials.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {materials.map((material, index) => (
                            <div key={index} className="p-2 border rounded flex items-center justify-between">
                              <div className="flex items-center">
                                <FileText className="h-4 w-4 mr-2 text-primary" />
                                <span className="text-sm">{material.name}</span>
                                <span className="ml-2 text-xs text-muted-foreground">({material.type})</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMaterial(index)}
                                className="h-8 w-8 p-0"
                              >
                                &times;
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={prevTab}>
                      Previous
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        "Create Course"
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
