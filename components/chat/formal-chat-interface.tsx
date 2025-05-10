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

interface Message {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  course_id: string | null;
  created_at: string;
  is_announcement: boolean;
  formatted_content: boolean;
  attachment_url: string | null;
  attachment_type: string | null;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export function FormalChatInterface() {
  const { user, profile } = useCurrentUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedChat, setSelectedChat] = useState("general");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<string | null>(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [isFormatted, setIsFormatted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

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

      const query = supabase
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
          profiles (
            first_name,
            last_name,
            avatar_url,
            role
          )
        `
        )
        .order("created_at", { ascending: true })
        .limit(100);

      // Filter by chat type
      if (selectedChat !== "general") {
        query.eq("message_type", selectedChat);
      }

      const { data, error } = await query;

      if (error) throw error;

      setMessages(data || []);
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

    // Subscribe to new messages
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
          // Fetch the profile data for the new message
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
            profiles: profileData,
          } as Message;

          // Only add to current view if it matches the selected chat type
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

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        content: message,
        message_type: selectedChat,
        course_id: null, // Global chat
        is_announcement: isAnnouncement,
        formatted_content: isFormatted,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
      });

      if (error) throw error;

      setMessage("");
      setAttachmentUrl(null);
      setAttachmentType(null);
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
    // Mock implementation - in a real app, upload file to storage
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Mock attachment URL
      setAttachmentUrl(`/api/files/${file.name}`);
      setAttachmentType(file.type.split("/")[0]); // 'image', 'application', etc.

      toast({
        title: "File attached",
        description: `${file.name} has been attached to your message.`,
      });
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  const renderAttachmentPreview = (url: string, type: string | null) => {
    if (!url) return null;

    if (type === "image") {
      return (
        <div className="relative mt-2 rounded-md border overflow-hidden">
          <ImageIcon
            src={url || "/placeholder.svg"}
            alt="Attachment"
            className="max-h-40 object-cover"
          />
        </div>
      );
    } else {
      return (
        <div className="relative mt-2 p-2 rounded-md border bg-muted/50 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="text-sm truncate">{url.split("/").pop()}</span>
        </div>
      );
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <Tabs
        defaultValue="general"
        value={selectedChat}
        onValueChange={setSelectedChat}
        className="w-full"
      >
        <div className="flex justify-between items-center border-b p-2">
          <TabsList className="grid grid-cols-4 w-auto">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="academic">Academic</TabsTrigger>
            <TabsTrigger value="support">Support</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
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
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23bbb' fillOpacity='0.05' fillRule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: "cover",
              backgroundRepeat: "repeat",
            }}
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "center",
                opacity: 0.3,
              }}
            ></div>

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
                    // Check if we need to show a date separator
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
                            <Avatar className="h-8 w-8 mt-1">
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
                                    ? "bg-primary text-primary-foreground"
                                    : msg.is_announcement
                                    ? "bg-amber-50dark:bg-[#1e1e1c]-amber-950/20 border border-amber-200 dark:border-amber-800"
                                    : "bg-card border"
                                }`}
                                style={{
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  className="absolute inset-0 opacity-10 pointer-events-none"
                                  style={{
                                    backgroundImage: isCurrentUser
                                      ? "none"
                                      : "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%, transparent 50%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.05) 75%, transparent 75%, transparent)",
                                    backgroundSize: "4px 4px",
                                  }}
                                ></div>
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
                                    msg.attachment_type
                                  )}
                              </div>

                              <div className="flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0"
                                    >
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Reply</DropdownMenuItem>
                                    <DropdownMenuItem>
                                      Copy Text
                                    </DropdownMenuItem>
                                    {isCurrentUser && (
                                      <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
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

          <div className="p-4 border-t">
            <div className="space-y-4">
              {attachmentUrl &&
                renderAttachmentPreview(attachmentUrl, attachmentType)}

              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 min-h-[100px]"
                  disabled={!user || sending}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                        >
                          <Paperclip className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Attach file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="icon">
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFormatted(!isFormatted)}
                        >
                          <Bold className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFormatted(!isFormatted)}
                        >
                          <Italic className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFormatted(!isFormatted)}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsFormatted(!isFormatted)}
                        >
                          <LinkIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>

                  {user?.role === "teacher" || user?.role === "admin" ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={isAnnouncement ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsAnnouncement(!isAnnouncement)}
                          >
                            Announcement
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mark as announcement</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                </div>

                <Button
                  onClick={handleSendMessage}
                  disabled={
                    !user || sending || (!message.trim() && !attachmentUrl)
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
        </TabsContent>

        <TabsContent value="academic" className="p-0 m-0 flex-1 flex flex-col">
          {/* Similar content as general, filtered for academic */}
          <div className="flex-1 p-4 flex items-center justify-center">
            <p className="text-muted-foreground">Academic discussion channel</p>
          </div>
        </TabsContent>

        <TabsContent value="support" className="p-0 m-0 flex-1 flex flex-col">
          {/* Similar content as general, filtered for support */}
          <div className="flex-1 p-4 flex items-center justify-center">
            <p className="text-muted-foreground">Support channel</p>
          </div>
        </TabsContent>

        <TabsContent
          value="announcements"
          className="p-0 m-0 flex-1 flex flex-col"
        >
          {/* Similar content as general, filtered for announcements */}
          <div className="flex-1 p-4 flex items-center justify-center">
            <p className="text-muted-foreground">Announcements channel</p>
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
