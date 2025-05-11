"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { FileUpload } from "@/components/ui/file-upload";

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
});

interface AddCourseMaterialFormProps {
  courseId: string;
}

export function AddCourseMaterialForm({
  courseId,
}: AddCourseMaterialFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!fileUrl) {
      toast({
        title: "File required",
        description: "Please upload a file for this course material",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Add the material to the database
      const { error: dbError } = await supabase
        .from("course_materials")
        .insert({
          course_id: courseId,
          title: values.title,
          description: values.description || null,
          file_url: fileUrl,
          file_type: fileType || "application/octet-stream",
          file_size: fileSize || 0,
        });

      if (dbError) throw dbError;

      toast({
        title: "Material added",
        description: "The course material has been added successfully",
      });

      // Redirect back to course page
      router.push(`/dashboard/courses/${courseId}`);
      router.refresh();
    } catch (error: any) {
      console.error("Error adding course material:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to add course material",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleFileUploadComplete = (
    url: string,
    name: string,
    size: number,
    type: string
  ) => {
    setFileUrl(url);
    setFileName(name);
    setFileSize(size);
    setFileType(type);
    toast({
      title: "File uploaded",
      description: `${name} has been uploaded successfully`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
                    <FormDescription>
                      A descriptive title for the material
                    </FormDescription>
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
                    <FormDescription>
                      Provide additional information about this material
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <FormLabel>File</FormLabel>
                <FileUpload
                  bucket="course-materials"
                  path={`course-${courseId}`}
                  onUploadComplete={handleFileUploadComplete}
                  acceptedFileTypes=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.zip"
                  maxSizeMB={50}
                />
                {fileName && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Uploaded: {fileName} (
                    {fileSize
                      ? (fileSize / 1024 / 1024).toFixed(2) + " MB"
                      : "Unknown size"}
                    )
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !fileUrl}
                className="w-full"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Add Material
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
