"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useCurrentUser } from "@/hooks/use-current-user"
import { supabase } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Camera, Trash, Upload, X } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Slider } from "@/components/ui/slider"
import ReactCrop, { type Crop } from "react-image-crop"
import "react-image-crop/dist/ReactCrop.css"

export function ProfileImageUpload() {
  const { user, profile, refreshProfile } = useCurrentUser()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropDialog, setShowCropDialog] = useState(false)
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 100, height: 100, x: 0, y: 0 })
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null)
  const [zoom, setZoom] = useState(1)

  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (name: string) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return

    const file = e.target.files[0]
    const fileSize = file.size / 1024 / 1024 // size in MB
    if (fileSize > 5) {
      toast({
        title: "File too large",
        description: "Please select an image under 5MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setPreviewUrl(reader.result as string)
      setShowCropDialog(true)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = (crop: Crop) => {
    setCompletedCrop(crop)
  }

  const getCroppedImg = (image: HTMLImageElement, crop: Crop): Promise<Blob> => {
    const canvas = document.createElement("canvas")
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    canvas.width = crop.width || 0
    canvas.height = crop.height || 0
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      return Promise.reject(new Error("Could not get canvas context"))
    }

    ctx.drawImage(
      image,
      (crop.x || 0) * scaleX,
      (crop.y || 0) * scaleY,
      (crop.width || 0) * scaleX,
      (crop.height || 0) * scaleY,
      0,
      0,
      crop.width || 0,
      crop.height || 0,
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("Canvas is empty"))
            return
          }
          resolve(blob)
        },
        "image/jpeg",
        0.95,
      )
    })
  }

  const handleCropCancel = () => {
    setShowCropDialog(false)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleCropSave = async () => {
    if (!imageRef.current || !completedCrop || !previewUrl || !user) return

    try {
      setUploading(true)

      // Get the cropped image blob
      const croppedImageBlob = await getCroppedImg(imageRef.current, completedCrop)

      // Convert blob to file
      const croppedImageFile = new File([croppedImageBlob], "profile-image.jpg", { type: "image/jpeg" })

      // Generate a unique file name
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.jpg`
      const filePath = `avatars/${fileName}`

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, croppedImageFile)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: publicUrlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

      // Update the user's profile with the new avatar URL
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrlData.publicUrl })
        .eq("id", user.id)

      if (updateError) throw updateError

      // Refresh the profile to get the updated avatar
      await refreshProfile()

      toast({
        title: "Profile image updated",
        description: "Your profile image has been updated successfully",
      })

      // Close the dialog and reset
      setShowCropDialog(false)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    } catch (error: any) {
      console.error("Error uploading avatar:", error.message)
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload profile image",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteAvatar = async () => {
    if (!user || !profile?.avatar_url) return

    try {
      setDeleting(true)

      // Extract the file path from the URL
      const url = new URL(profile.avatar_url)
      const filePath = url.pathname.split("/").slice(-2).join("/")

      // Delete the file from storage (this might fail if the path is not correct)
      try {
        await supabase.storage.from("avatars").remove([filePath])
      } catch (error) {
        console.error("Error removing file from storage:", error)
        // Continue anyway, as we still want to remove the URL from the profile
      }

      // Update the user's profile to remove the avatar URL
      const { error: updateError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id)

      if (updateError) throw updateError

      // Refresh the profile
      await refreshProfile()

      toast({
        title: "Profile image removed",
        description: "Your profile image has been removed",
      })
    } catch (error: any) {
      console.error("Error deleting avatar:", error.message)
      toast({
        title: "Error",
        description: error.message || "Failed to remove profile image",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

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
                profile?.first_name && profile?.last_name ? `${profile.first_name} ${profile.last_name}` : "",
              )}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0">
            <label
              htmlFor="avatar-upload"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {uploading ? <LoadingSpinner size="sm" /> : <Camera className="h-5 w-5" />}
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
              disabled={uploading || deleting}
            />
          </div>
        </div>

        {profile?.avatar_url && (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleDeleteAvatar}
            disabled={uploading || deleting}
          >
            {deleting ? <LoadingSpinner size="sm" /> : <Trash className="h-4 w-4" />}
            <span>Remove Image</span>
          </Button>
        )}
      </motion.div>

      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crop Profile Image</DialogTitle>
            <DialogDescription>Adjust your profile picture to get the perfect crop.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-md">
              {previewUrl && (
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imageRef}
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview"
                    style={{ transform: `scale(${zoom})` }}
                    className="max-h-[300px] w-full object-contain transition-transform"
                  />
                </ReactCrop>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">Zoom</span>
                <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
              </div>
              <Slider value={[zoom]} min={0.5} max={3} step={0.1} onValueChange={(value) => setZoom(value[0])} />
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleCropCancel} disabled={uploading}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleCropSave} disabled={uploading}>
                {uploading ? <LoadingSpinner size="sm" className="mr-2" /> : <Upload className="mr-2 h-4 w-4" />}
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
