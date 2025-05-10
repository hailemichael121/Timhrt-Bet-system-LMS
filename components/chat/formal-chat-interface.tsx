"use client";

import React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Send,
  Loader2,
  Paperclip,
  ImageIcon,
  FileText,
  Info,
  X,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  PlusCircle,
  Bold,
  Italic,
  List,
  LinkIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { AdvancedImage } from "@cloudinary/react";
import { Cloudinary } from "@cloudinary/url-gen";
import { fill } from "@cloudinary/url-gen/actions/resize";

interface Profile {
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  role: string;
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: "general" | "academic" | "support" | "announcements";
  course_id: string | null;
  created_at: string;
  is_announcement: boolean;
  formatted_content: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  attachment_name: string | null;
  profiles: Profile;
}

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },
});

export function FormalChatInterface() {
  const { user, profile } = useCurrentUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedChat, setSelectedChat] = useState<
    "general" | "academic" | "support" | "announcements"
  >("general");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user, selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          content,
          message_type,
          course_id,
          created_at,
          is_announcement,
          formatted_content,
          attachment_url,
          attachment_type,
          attachment_name,
          profiles:profiles (
            first_name,
            last_name,
            avatar_url,
            role
          )
        `
        )
        .order("created_at", { ascending: true })
        .limit(100);

      if (selectedChat !== "general") {
        query = query.eq("message_type", selectedChat);
      }

      const { data, error } = await query;

      if (error) throw error;

      const typedData = (data || []).map((item) => ({
        ...item,
        profiles: item.profiles as Profile,
        message_type: item.message_type as
          | "general"
          | "academic"
          | "support"
          | "announcements",
      }));

      setMessages(typedData);
    } catch (error: any) {
      console.error("Error fetching messages:", error.message);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }

    const subscription = supabase
      .channel("messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("first_name, last_name, avatar_url, role")
            .eq("id", payload.new.sender_id)
            .single();

          if (profileError) {
            console.error("Error fetching profile for message:", profileError);
            return;
          }

          const newMessage = {
            ...payload.new,
            profiles: profileData as Profile,
            message_type: payload.new.message_type as
              | "general"
              | "academic"
              | "support"
              | "announcements",
          } as Message;

          if (
            selectedChat === "general" ||
            newMessage.message_type === selectedChat
          ) {
            setMessages((prev) => [...prev, newMessage]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !attachmentUrl) return;
    if (!user) return;

    try {
      setSending(true);

      const { error } = await supabase.from("messages").insert([
        {
          sender_id: user.id,
          content: message,
          message_type: selectedChat,
          course_id: null,
          is_announcement: isAnnouncement,
          formatted_content: isFormatted,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType,
          attachment_name: attachmentName,
        },
      ]);

      if (error) throw error;

      setMessage("");
      setAttachmentUrl(null);
      setAttachmentType(null);
      setAttachmentName(null);
      setIsAnnouncement(false);
      setIsFormatted(false);
    } catch (error: any) {
      console.error("Error sending message:", error.message);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), "h:mm a");
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "upload_preset",
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
      );

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (data.secure_url) {
        setAttachmentUrl(data.secure_url);
        setAttachmentType(file.type.split("/")[0]);
        setAttachmentName(file.name);

        toast({
          title: "File uploaded",
          description: `${file.name} has been attached to your message.`,
        });
      } else {
        throw new Error("Upload failed");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = () => {
    setAttachmentUrl(null);
    setAttachmentType(null);
    setAttachmentName(null);
  };

  const renderAttachmentPreview = (
    url: string,
    type: string | null,
    name: string | null
  ) => {
    if (!url) return null;

    if (type === "image") {
      const myImage = cld
        .image(url.split("/").pop()?.split(".")[0] || "")
        .resize(fill().width(300).height(200));

      return (
        <div className="relative mt-2 rounded-md border overflow-hidden group">
          <AdvancedImage cldImg={myImage} className="w-full h-auto" />
          <button
            onClick={removeAttachment}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    } else {
      return (
        <div className="relative mt-2 p-2 rounded-md border bg-muted/50 flex items-center gap-2 group">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm truncate flex-1">{name}</span>
          <button
            onClick={removeAttachment}
            className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      );
    }
  };

  const renderInputSection = () => (
    <div className="p-4 border-t bg-white dark:bg-gray-800">
      <div className="space-y-4">
        {attachmentUrl &&
          renderAttachmentPreview(
            attachmentUrl,
            attachmentType,
            attachmentName
          )}

        <div className="flex gap-2">
          <Textarea
            placeholder={`Type your ${selectedChat} message...`}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 min-h-[100px] bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600"
            disabled={!user || sending || uploading}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="file-upload"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach file</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" disabled={uploading}>
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-1">
                  <Button
                    variant={isFormatted ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setIsFormatted(!isFormatted)}
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isFormatted ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setIsFormatted(!isFormatted)}
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isFormatted ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setIsFormatted(!isFormatted)}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={isFormatted ? "default" : "ghost"}
                    size="icon"
                    onClick={() => setIsFormatted(!isFormatted)}
                  >
                    <LinkIcon className="h-4 w-4" />
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            {(user?.role === "teacher" || user?.role === "admin") && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={isAnnouncement ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsAnnouncement(!isAnnouncement)}
                      disabled={uploading || selectedChat !== "announcements"}
                    >
                      Announcement
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Mark as announcement (only available in Announcements tab)
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={
              !user ||
              sending ||
              uploading ||
              (!message.trim() && !attachmentUrl)
            }
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="flex flex-col h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Tabs
        defaultValue="general"
        value={selectedChat}
        onValueChange={(value) => {
          setSelectedChat(
            value as "general" | "academic" | "support" | "announcements"
          );
          setIsAnnouncement(false);
        }}
        className="w-full"
      >
        <div className="flex justify-between items-center border-b p-2 bg-white dark:bg-gray-800">
          <TabsList className="grid grid-cols-4 w-auto bg-gray-100 dark:bg-gray-700">
            <TabsTrigger
              value="general"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-600"
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="academic"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-600"
            >
              Academic
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-600"
            >
              Support
            </TabsTrigger>
            <TabsTrigger
              value="announcements"
              className="data-[state=active]:bg-white data-[state=active]:dark:bg-gray-600"
            >
              Announcements
            </TabsTrigger>
          </TabsList>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose a category for your messages</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <TabsContent value="general" className="p-0 m-0 flex-1 flex flex-col">
          <ScrollArea
            className="flex-1 px-4 pt-4 relative"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23999' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: "cover",
              backgroundRepeat: "repeat",
            }}
          >
            <div className="relative z-10">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-muted-foreground">
                    No messages yet. Start the conversation!
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg, index) => {
                    const showDateSeparator =
                      index === 0 ||
                      format(new Date(msg.created_at), "yyyy-MM-dd") !==
                        format(
                          new Date(messages[index - 1].created_at),
                          "yyyy-MM-dd"
                        );

                    const isCurrentUser = msg.sender_id === user?.id;
                    const senderName =
                      `${msg.profiles.first_name || ""} ${
                        msg.profiles.last_name || ""
                      }`.trim() || "Unknown User";
                    const avatarUrl =
                      msg.profiles.avatar_url || "/placeholder.svg";

                    return (
                      <React.Fragment key={msg.id}>
                        {showDateSeparator && (
                          <div className="flex items-center justify-center my-4">
                            <div className="bg-muted/50 text-muted-foreground text-xs px-2 py-1 rounded-full">
                              {formatDate(msg.created_at)}
                            </div>
                          </div>
                        )}

                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`flex ${
                            isCurrentUser ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
                              isCurrentUser ? "flex-row-reverse" : ""
                            }`}
                          >
                            <Avatar className="h-8 w-8 mt-1 border border-gray-200 dark:border-gray-700">
                              <AvatarImage
                                src={avatarUrl || "/placeholder.svg"}
                              />
                              <AvatarFallback>
                                {getInitials(
                                  msg.profiles.first_name,
                                  msg.profiles.last_name
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <div
                              className={`space-y-1 ${
                                isCurrentUser ? "items-end" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-xs text-muted-foreground ${
                                    isCurrentUser ? "order-last" : ""
                                  }`}
                                >
                                  {formatTime(msg.created_at)}
                                </span>
                                <span className="text-sm font-medium">
                                  {senderName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-4"
                                >
                                  {msg.profiles.role}
                                </Badge>
                                {msg.is_announcement && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1 py-0 h-4"
                                  >
                                    Announcement
                                  </Badge>
                                )}
                              </div>
                              <div
                                className={`rounded-lg px-4 py-2 shadow-sm ${
                                  isCurrentUser
                                    ? "bg-blue-600 text-white"
                                    : msg.is_announcement
                                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                    : "bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600"
                                }`}
                              >
                                {msg.formatted_content ? (
                                  <div
                                    className="text-sm relative z-10 prose prose-sm dark:prose-invert max-w-none"
                                    dangerouslySetInnerHTML={{
                                      __html: msg.content,
                                    }}
                                  />
                                ) : (
                                  <p className="text-sm whitespace-pre-wrap relative z-10">
                                    {msg.content}
                                  </p>
                                )}

                                {msg.attachment_url &&
                                  renderAttachmentPreview(
                                    msg.attachment_url,
                                    msg.attachment_type,
                                    msg.attachment_name
                                  )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
          {renderInputSection()}
        </TabsContent>

        <TabsContent value="academic" className="p-0 m-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 px-4 pt-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">
                  No academic messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage
                        src={msg.profiles.avatar_url || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {getInitials(
                          msg.profiles.first_name,
                          msg.profiles.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {msg.profiles.first_name} {msg.profiles.last_name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          {msg.profiles.role}
                        </Badge>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          {renderInputSection()}
        </TabsContent>

        <TabsContent value="support" className="p-0 m-0 flex-1 flex flex-col">
          <ScrollArea className="flex-1 px-4 pt-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">
                  No support messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage
                        src={msg.profiles.avatar_url || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {getInitials(
                          msg.profiles.first_name,
                          msg.profiles.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {msg.profiles.first_name} {msg.profiles.last_name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          {msg.profiles.role}
                        </Badge>
                      </div>
                      <div className="bg-white dark:bg-gray-700 rounded-lg px-4 py-2 shadow-sm border border-gray-200 dark:border-gray-600">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          {renderInputSection()}
        </TabsContent>

        <TabsContent
          value="announcements"
          className="p-0 m-0 flex-1 flex flex-col"
        >
          <ScrollArea className="flex-1 px-4 pt-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <p className="text-muted-foreground">No announcements yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((msg) => (
                  <div key={msg.id} className="flex gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage
                        src={msg.profiles.avatar_url || "/placeholder.svg"}
                      />
                      <AvatarFallback>
                        {getInitials(
                          msg.profiles.first_name,
                          msg.profiles.last_name
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {msg.profiles.first_name} {msg.profiles.last_name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1 py-0 h-4"
                        >
                          {msg.profiles.role}
                        </Badge>
                        {msg.is_announcement && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1 py-0 h-4"
                          >
                            Announcement
                          </Badge>
                        )}
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg px-4 py-2 shadow-sm border border-amber-200 dark:border-amber-800">
                        <p className="text-sm">{msg.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>
          {renderInputSection()}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
