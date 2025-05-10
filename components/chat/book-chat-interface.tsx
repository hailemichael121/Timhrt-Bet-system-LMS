"use client";

import type React from "react";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Loader2, BookOpen } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  course_id: string | null;
  created_at: string;
  profiles: {
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string;
  };
}

export function BookChatInterface() {
  const { user, profile } = useCurrentUser();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add page turn effect
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
          profiles (
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

          setMessages((prev) => [...prev, newMessage]);
          turnPage(); // Add page turn effect when new message arrives
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
        course_id: null, // Global chat
      });

      if (error) throw error;

      setMessage("");
      turnPage(); // Add page turn effect when sending message
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

  return (
    <div className="book-container relative w-full h-full overflow-hidden rounded-lg shadow-2xl">
      {/* Book cover */}
      <div className="book-cover absolute inset-0 bg-gradient-to-r from-amber-800 to-amber-700 z-0">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-24 w-24 text-amber-100/20" />
        </div>
        <div className="absolute inset-0 bg-[url('/paper-texture.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute left-0 top-0 bottom-0 w-[30px] bg-gradient-to-r from-amber-900 to-transparent"></div>
        <div className="absolute right-0 top-0 bottom-0 w-[30px] bg-gradient-to-l from-amber-900 to-transparent"></div>
      </div>

      {/* Book pages */}
      <div
        ref={bookRef}
        className="book-pages relative z-10 flex flex-col h-full bg-amber-50 dark:bg-amber-950 rounded-lg overflow-hidden transition-transform duration-500 ease-in-out"
      >
        <Card className="flex flex-col h-full border-0 rounded-none bg-transparent shadow-none">
          <ScrollArea
            className="flex-1 p-4 relative"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23805a00' fillOpacity='0.05' fillRule='evenodd'/%3E%3C/svg%3E")`,
              backgroundSize: "cover",
              backgroundRepeat: "repeat",
            }}
          >
            {/* Book lines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  "linear-gradient(to bottom, rgba(205, 133, 63, 0.1) 1px, transparent 1px)",
                backgroundSize: "100% 24px",
                backgroundPosition: "center",
              }}
            ></div>

            {/* Book binding shadow */}
            <div className="absolute left-0 top-0 bottom-0 w-[20px] bg-gradient-to-r from-amber-800/20 to-transparent pointer-events-none"></div>

            <div className="relative z-10">
              {loading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-800" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex justify-center items-center h-40">
                  <p className="text-amber-800/70 italic">
                    The pages are blank. Start writing your story...
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {messages.map((msg) => {
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
                            <Avatar className="h-8 w-8 border-2 border-amber-200 dark:border-amber-800">
                              <AvatarImage
                                src={avatarUrl || "/placeholder.svg"}
                              />
                              <AvatarFallback className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
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
                                  className={`text-xs text-amber-800/70 dark:text-amber-200/70 ${
                                    isCurrentUser ? "order-last" : ""
                                  }`}
                                >
                                  {formatTime(msg.created_at)}
                                </span>
                                <span className="text-sm font-medium text-amber-900 dark:text-amber-100">
                                  {senderName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-1 py-0 h-4 border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-200"
                                >
                                  {msg.profiles.role}
                                </Badge>
                              </div>
                              <div
                                className={`rounded-lg px-4 py-2 shadow-sm ${
                                  isCurrentUser
                                    ? "bg-amber-800 text-amber-50 dark:bg-amber-700"
                                    : "bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-50 border border-amber-200 dark:border-amber-800"
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
                                <p className="text-sm whitespace-pre-wrap relative z-10">
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

          <div className="p-4 border-t border-amber-200 dark:border-amber-800 bg-amber-100/50 dark:bg-amber-900/50">
            <div className="flex gap-2">
              <Input
                placeholder="Write in the book..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 focus-visible:ring-amber-500"
                disabled={!user || sending}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                disabled={!user || sending || !message.trim()}
                className="bg-amber-800 hover:bg-amber-700 text-amber-50"
              >
                {sending ? (
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
      <div className="book-binding absolute left-0 top-0 bottom-0 w-[15px] bg-amber-900 z-20 rounded-l-lg"></div>
    </div>
  );
}
