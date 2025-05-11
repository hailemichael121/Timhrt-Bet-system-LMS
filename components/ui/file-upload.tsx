"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  X,
  FileText,
  ImageIcon,
  Film,
  Music,
  File,
  AlertCircle,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface FileUploadProps {
  bucket: string;
  path: string;
  onUploadComplete: (
    url: string,
    name: string,
    size: number,
    type: string
  ) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  multiple?: boolean;
  className?: string;
}

export function FileUpload({
  bucket,
  path,
  onUploadComplete,
  acceptedFileTypes = "*",
  maxSizeMB = 10,
  multiple = false,
  className,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    await uploadFiles(event.target.files);
  };

  const uploadFiles = async (files: FileList) => {
    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Check file size
        if (file.size > maxSizeMB * 1024 * 1024) {
          throw new Error(`File size exceeds the ${maxSizeMB}MB limit`);
        }

        // Check file type if specified
        if (acceptedFileTypes !== "*") {
          const fileTypes = acceptedFileTypes.split(",");
          const fileExtension = `.${file.name.split(".").pop()}`;
          const isAccepted = fileTypes.some((type) => {
            // Handle both .ext and mime type formats
            return type.startsWith(".")
              ? type === fileExtension
              : file.type.includes(type);
          });

          if (!isAccepted) {
            throw new Error(
              `File type not accepted. Please upload ${acceptedFileTypes}`
            );
          }
        }

        // Generate a unique file name to prevent collisions
        const fileExt = file.name.split(".").pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${path}/${fileName}`;

        // Upload file to Supabase Storage
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            onUploadProgress: (progress) => {
              setProgress(Math.round((progress.loaded / progress.total) * 100));
            },
          });

        if (error) throw error;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        // Call the callback with the URL and original file name
        onUploadComplete(urlData.publicUrl, file.name, file.size, file.type);

        // If not multiple, break after first file
        if (!multiple) break;
      }

      toast({
        title: "Upload complete",
        description: multiple
          ? "Files uploaded successfully"
          : "File uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setError(error.message || "Failed to upload file");
      toast({
        title: "Upload failed",
        description: error.message || "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setProgress(0);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  };

  const getFileTypeIcon = (type: string) => {
    if (type.includes("image"))
      return <ImageIcon className="h-6 w-6 text-blue-500" />;
    if (type.includes("video"))
      return <Film className="h-6 w-6 text-red-500" />;
    if (type.includes("audio"))
      return <Music className="h-6 w-6 text-green-500" />;
    if (type.includes("pdf") || type.includes("document"))
      return <FileText className="h-6 w-6 text-amber-500" />;
    return <File className="h-6 w-6 text-gray-500" />;
  };

  return (
    <div className={className}>
      <div
        className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="rounded-full bg-primary/10 p-3">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">
              Drag & drop your file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              {acceptedFileTypes === "*" ? "All file types" : acceptedFileTypes}{" "}
              up to {maxSizeMB}MB
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="relative"
          >
            {uploading ? "Uploading..." : "Select File"}
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              onChange={handleFileChange}
              accept={acceptedFileTypes}
              multiple={multiple}
              disabled={uploading}
            />
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {uploading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Uploading...</span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 flex items-start gap-2"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
