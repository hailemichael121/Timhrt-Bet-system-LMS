"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { Loader2, Upload } from "lucide-react"
import { motion } from "framer-motion"

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  file: z
    .instanceof(FileList)
    .refine((files) => files.length === 1, {
      message: "Please select a file.",
    })
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, `Max file size is 50MB.`),
})

interface AddCourseMaterialFormProps {
  courseId: string
}

export function AddCourseMaterialForm({ courseId }: AddCourseMaterialFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsSubmitting(true)
      setUploadProgress(0)

      const file = values.file[0]
      if (!file) return

      // Generate a unique file name
      const fileExt = file.name.split(".").pop()
      const fileName = `${courseId}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `course-materials/${fileName}`

      // Create a custom upload with progress tracking
      const { error: uploadError } = await supabase.storage.from("course-materials").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          setUploadProgress(percent)
        },
      })

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("course-materials").getPublicUrl(filePath)

      // Add the material to the database
      const { error: dbError } = await supabase.from("course_materials").insert({
        course_id: courseId,
        title: values.title,
        description: values.description || null,
        file_url: publicUrlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      })

      if (dbError) throw dbError

      toast({
        title: "Material added",
        description: "The course material has been added successfully",
      })

      // Redirect back to course page
      router.push(`/dashboard/courses/${courseId}`)
      router.refresh()
    } catch (error: any) {
      console.error("Error adding course material:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to add course material",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
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
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter material title" {...field} />
                    </FormControl>
                    <FormDescription>A descriptive title for the material</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter a description of the material"
                        className="resize-none min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Provide additional information about this material</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="file"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <div className="grid w-full gap-2">
                        <Input
                          type="file"
                          onChange={(e) => {
                            onChange(e.target.files)
                          }}
                          {...rest}
                          className="cursor-pointer"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>Upload a file (PDF, DOCX, PPTX, etc.) - Max size: 50MB</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isSubmitting && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Uploading: {uploadProgress}%</div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Material
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
