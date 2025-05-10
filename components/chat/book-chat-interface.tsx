"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, BookOpen, Bell } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  course_id: string | null;
  created_at: string;
  message_type: string;
  profiles: Profile;
}

export function BookChatInterface() {
  const { user, profile } = useCurrentUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({
    general: 0,
    academic: 0,
    support: 0,
    announcements: 0,
  });
  const [lastReadTimestamps, setLastReadTimestamps] = useState({
    general: new Date().toISOString(),
    academic: new Date().toISOString(),
    support: new Date().toISOString(),
    announcements: new Date().toISOString(),
  });
  const [activeTab, setActiveTab] = useState("general");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
      const savedTimestamps = localStorage.getItem("chatLastReadTimestamps");
      if (savedTimestamps) {
        setLastReadTimestamps(JSON.parse(savedTimestamps));
      }
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(
      "chatLastReadTimestamps",
      JSON.stringify(lastReadTimestamps)
    );
    updateUnreadCounts();
  }, [lastReadTimestamps]);

  useEffect(() => {
    if (user) {
      setLastReadTimestamps((prev) => ({
        ...prev,
        [activeTab]: new Date().toISOString(),
      }));
    }
  }, [activeTab, user]);

  const turnPage = () => {
    if (bookRef.current) {
      bookRef.current.classList.add("page-turn");
      setTimeout(() => {
        if (bookRef.current) {
          bookRef.current.classList.remove("page-turn");
        }
      }, 1000);
    }
  };

  const updateUnreadCounts = async () => {
    if (!user) return;

    try {
      const now = new Date().toISOString();

      const { count: generalCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("message_type", "general")
        .gt("created_at", lastReadTimestamps.general)
        .lt("created_at", now);

      const { count: academicCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("message_type", "academic")
        .gt("created_at", lastReadTimestamps.academic)
        .lt("created_at", now);

      const { count: supportCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("message_type", "support")
        .gt("created_at", lastReadTimestamps.support)
        .lt("created_at", now);

      const { count: announcementsCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("message_type", "announcements")
        .gt("created_at", lastReadTimestamps.announcements)
        .lt("created_at", now);

      setUnreadCounts({
        general: generalCount || 0,
        academic: academicCount || 0,
        support: supportCount || 0,
        announcements: announcementsCount || 0,
      });
    } catch (error) {
      console.error("Error updating unread counts:", error);
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("messages")
        .select(
          `
          id,
          sender_id,
          content,
          course_id,
          created_at,
          message_type,
          profiles:profiles (
            first_name,
            last_name,
            avatar_url,
            role
          )
        `
        )
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) throw error;

      // Cast the data to our Message type
      const typedData = data?.map((item) => ({
        ...item,
        profiles: item.profiles as Profile,
      })) as Message[];

      setMessages(typedData || []);
      updateUnreadCounts();
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
          } as Message;

          setMessages((prev) => [...prev, newMessage]);
          turnPage();

          if (payload.new.message_type !== activeTab) {
            setUnreadCounts((prev) => ({
              ...prev,
              [payload.new.message_type]:
                (prev[payload.new.message_type as keyof typeof unreadCounts] ||
                  0) + 1,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user) return;

    try {
      setSending(true);

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        content: message,
        course_id: null,
        message_type: activeTab,
      });

      if (error) throw error;

      setMessage("");
      turnPage();
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

  const getInitials = (firstName: string | null, lastName: string | null) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`;
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Mark messages as read when switching tabs
    setLastReadTimestamps((prev) => ({
      ...prev,
      [tab]: new Date().toISOString(),
    }));
  };

  return (
    <div className="book-container relative w-full h-full overflow-hidden rounded-lg shadow-2xl border border-gray-300 dark:border-gray-700">
      {/* Book cover */}
      <div className="book-cover absolute inset-0 bg-gradient-to-r from-gray-800 to-gray-700 z-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-24 w-24 text-gray-100/20" />
        </div>
        <div className="absolute inset-0 bg-[url('/paper-texture.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute left-0 top-0 bottom-0 w-[30px] bg-gradient-to-r from-gray-900 to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[30px] bg-gradient-to-l from-gray-900 to-transparent"></div>
      </div>

      {/* Book pages */}
      <div
        ref={bookRef}
        className="book-pages relative z-10 flex flex-col h-full bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden transition-transform duration-500 ease-in-out"
      >
        <Card className="flex flex-col h-full border-0 rounded-none bg-transparent shadow-none">
          <div className="flex justify-between items-center border-b p-2 bg-gray-100 dark:bg-gray-800">
            <div className="flex space-x-1">
              <Button
                variant="ghost"
                className={cn(
                  "relative px-3 py-1 text-sm",
                  activeTab === "general" ? "bg-white dark:bg-gray-700" : ""
                )}
                onClick={() => handleTabChange("general")}
              >
                General
                {unreadCounts.general > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCounts.general}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "relative px-3 py-1 text-sm",
                  activeTab === "academic" ? "bg-white dark:bg-gray-700" : ""
                )}
                onClick={() => handleTabChange("academic")}
              >
                Academic
                {unreadCounts.academic > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCounts.academic}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "relative px-3 py-1 text-sm",
                  activeTab === "support" ? "bg-white dark:bg-gray-700" : ""
                )}
                onClick={() => handleTabChange("support")}
              >
                Support
                {unreadCounts.support > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCounts.support}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                className={cn(
                  "relative px-3 py-1 text-sm",
                  activeTab === "announcements"
                    ? "bg-white dark:bg-gray-700"
                    : ""
                )}
                onClick={() => handleTabChange("announcements")}
              >
                Announcements
                {unreadCounts.announcements > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                    {unreadCounts.announcements}
                  </span>
                )}
              </Button>
            </div>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4 relative">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(0, 0, 0, 0.05) 1px, transparent 1px)",
                backgroundSize: "100% 24px",
              }}
            ></div>

            <div className="relative z-10">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : messages.filter((m) => m.message_type === activeTab)
                  .length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-gray-500 italic">
                    The pages are blank. Start writing your story...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {messages
                      .filter((m) => m.message_type === activeTab)
                      .map((msg) => {
                        const isCurrentUser = msg.sender_id === user?.id;
                        const senderName =
                          `${msg.profiles.first_name || ""} ${
                            msg.profiles.last_name || ""
                          }`.trim() || "Unknown User";
                        const avatarUrl = msg.profiles.avatar_url || "";

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className={`flex ${
                              isCurrentUser ? "justify-end" : "justify-start"
                            }`}
                          >
                            <div
                              className={`flex gap-3 max-w-[80%] ${
                                isCurrentUser ? "flex-row-reverse" : ""
                              }`}
                            >
                              <Avatar className="h-8 w-8 border-2 border-gray-200 dark:border-gray-700">
                                <AvatarImage
                                  src={avatarUrl || "/placeholder.svg"}
                                />
                                <AvatarFallback className="bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
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
                                    className={`text-xs text-gray-500 dark:text-gray-400 ${
                                      isCurrentUser ? "order-last" : ""
                                    }`}
                                  >
                                    {formatTime(msg.created_at)}
                                  </span>
                                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                    {senderName}
                                  </span>
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] px-1 py-0 h-4 border-gray-300 text-gray-800 dark:border-gray-600 dark:text-gray-200"
                                  >
                                    {msg.profiles.role}
                                  </Badge>
                                </div>
                                <div
                                  className={`rounded-lg px-4 py-2 shadow-sm ${
                                    isCurrentUser
                                      ? "bg-blue-600 text-white"
                                      : "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-600"
                                  }`}
                                >
                                  <p className="text-sm whitespace-pre-wrap">
                                    {msg.content}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                  </AnimatePresence>
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
            <div className="flex gap-2">
              <Input
                placeholder="Write in the book..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus-visible:ring-blue-500"
                disabled={!user || sending || loading} // Added loading to disabled conditions
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!user || sending || loading || !message.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {sending || loading ? ( // Show spinner for both sending and loading states
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      {/* Book binding */}
      <div className="book-binding absolute left-0 top-0 bottom-0 w-[15px] bg-gray-900 z-20 rounded-l-lg"></div>
    </div>
  );
}
