"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { FileText, Download, Plus, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CourseMaterialsProps {
  courseId: string;
}

export function CourseMaterials({ courseId }: CourseMaterialsProps) {
  const { user, profile } = useCurrentUser();
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<any>(null);

  const isTeacher = profile?.role === "teacher" || profile?.role === "admin";

  useEffect(() => {
    if (courseId) {
      fetchMaterials();
    }
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("course_materials")
        .select("*")
        .eq("course_id", courseId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setMaterials(data || []);
    } catch (error) {
      console.error("Error fetching course materials:", error);
      toast({
        title: "Error",
        description: "Failed to load course materials",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!materialToDelete) return;

    try {
      setDeleting(materialToDelete.id);

      // Soft delete in the database
      const { error } = await supabase
        .from("course_materials")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", materialToDelete.id);

      if (error) throw error;

      // Try to delete from storage (this might fail if the file path is not correct)
      try {
        const url = new URL(materialToDelete.file_url);
        const filePath = url.pathname.split("/").slice(-2).join("/");
        await supabase.storage.from("course-materials").remove([filePath]);
      } catch (storageError) {
        console.error("Error removing file from storage:", storageError);
        // Continue anyway as we've already soft-deleted in the database
      }

      // Update the local state
      setMaterials(materials.filter((m) => m.id !== materialToDelete.id));

      toast({
        title: "Material deleted",
        description: "The course material has been removed",
      });
    } catch (error) {
      console.error("Error deleting material:", error);
      toast({
        title: "Error",
        description: "Failed to delete course material",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
      setShowDeleteDialog(false);
      setMaterialToDelete(null);
    }
  };

  const confirmDelete = (material: any) => {
    setMaterialToDelete(material);
    setShowDeleteDialog(true);
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("spreadsheet") || fileType.includes("excel"))
      return "📊";
    if (fileType.includes("presentation") || fileType.includes("powerpoint"))
      return "📑";
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("video")) return "🎬";
    if (fileType.includes("audio")) return "🎵";
    if (fileType.includes("zip") || fileType.includes("compressed"))
      return "🗜️";
    return "📁";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <LoadingSpinner text="Loading course materials..." />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Course Materials</CardTitle>
            <CardDescription>
              Resources and documents for this course
            </CardDescription>
          </div>
          {isTeacher && (
            <Link href={`/dashboard/courses/${courseId}/materials/add`}>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {materials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
              <p>No materials have been added to this course yet.</p>
              {isTeacher && (
                <p className="mt-2">
                  <Link
                    href={`/dashboard/courses/${courseId}/materials/add`}
                    className="text-primary hover:underline"
                  >
                    Add your first material
                  </Link>{" "}
                  to get started.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {materials.map((material) => (
                <div
                  key={material.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start space-x-3 mb-3 sm:mb-0">
                    <div className="text-2xl">
                      {getFileIcon(material.file_type)}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium">{material.title}</div>
                      {material.description && (
                        <p className="text-sm text-muted-foreground">
                          {material.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {material.file_type.split("/")[1]?.toUpperCase() ||
                            material.file_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatBytes(material.file_size || 0)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Added{" "}
                          {formatDistanceToNow(new Date(material.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2 self-end sm:self-auto">
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Download className="mr-1 h-3 w-3" />
                      Download
                    </a>
                    <a
                      href={material.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <ExternalLink className="mr-1 h-3 w-3" />
                      View
                    </a>
                    {isTeacher && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => confirmDelete(material)}
                        disabled={deleting === material.id}
                      >
                        {deleting === material.id ? (
                          <LoadingSpinner size="xs" className="mr-1" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the material &quot;{materialToDelete?.title}
              &quot; from the course. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteMaterial}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
