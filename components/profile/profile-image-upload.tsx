"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Camera, Trash } from "lucide-react";
import { motion } from "framer-motion";
import { FileUpload } from "@/components/ui/file-upload";
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

export function ProfileImageUpload() {
  const { user, profile, refreshProfile } = useCurrentUser();
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleFileUploadComplete = async (url: string) => {
    try {
      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: url })
        .eq("id", user?.id);

      if (updateError) throw updateError;

      // Refresh the profile to get the updated avatar
      await refreshProfile();

      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully",
      });

      // Close the dialog
      setShowUploadDialog(false);
    } catch (error: any) {
      console.error("Error updating profile image:", error.message);
      toast({
        title: "Update failed",
        description: error.message || "Failed to update profile image",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return;

    try {
      setDeleting(true);

      // Extract the file path from the URL
      const url = new URL(profile.avatar_url);
      const filePath = url.pathname.split("/").slice(-2).join("/");

      // Delete the file from storage (this might fail if the path is not correct)
      try {
        await supabase.storage.from("profile-images").remove([filePath]);
      } catch (error) {
        console.error("Error removing file from storage:", error);
        // Continue anyway, as we still want to remove the URL from the profile
      }

      // Update the user's profile to remove the avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Refresh the profile
      await refreshProfile();

      toast({
        title: "Profile image removed",
        description: "Your profile image has been removed",
      });
    } catch (error: any) {
      console.error("Error deleting avatar:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile image",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-primary/10">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback className="text-3xl bg-primary/5 text-primary">
              {getInitials(
                profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : ""
              )}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0">
            <Button
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={() => setShowUploadDialog(true)}
            >
              <Camera className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {profile?.avatar_url && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting}
          >
            {deleting ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Trash className="h-4 w-4" />
            )}
            <span>Remove Image</span>
          </Button>
        )}
      </motion.div>

      <AlertDialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Upload Profile Image</AlertDialogTitle>
            <AlertDialogDescription>
              Choose an image to use as your profile picture. The image will be
              visible to other users.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <FileUpload
              bucket="profile-images"
              path={user?.id || "temp"}
              onUploadComplete={(url) => handleFileUploadComplete(url)}
              acceptedFileTypes=".jpg,.jpeg,.png,.gif"
              maxSizeMB={5}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Profile Image</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove your profile image? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAvatar}
              className="bg-destructive text-destructive-foreground"
            >
              {deleting ? <LoadingSpinner size="sm" className="mr-2" /> : null}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
