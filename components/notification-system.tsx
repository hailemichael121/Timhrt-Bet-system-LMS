"use client"

import { useState, useEffect } from "react"
import { Bell, Check, X, Info, AlertCircle, MessageSquare, Calendar, FileText, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase/client"
import { useCurrentUser } from "@/hooks/use-current-user"
import { formatDistanceToNow } from "date-fns"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
  link: string | null
  related_id: string | null
}

export function NotificationSystem() {
  const { user } = useCurrentUser()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (!user) return

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from("notifications")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50)

        if (error) throw error

        if (data) {
          setNotifications(data)
          setUnreadCount(data.filter((n) => !n.read).length)
        }
      } catch (error) {
        console.error("Error fetching notifications:", error)
      }
    }

    fetchNotifications()

    // Subscribe to new notifications
    const subscription = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications((prev) => [newNotification, ...prev])
          setUnreadCount((prev) => prev + 1)

          // Show toast for new notification
          toast({
            title: newNotification.title,
            description: newNotification.message,
            action: newNotification.link ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={newNotification.link}>View</Link>
              </Button>
            ) : undefined,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [user])

  const markAsRead = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount((prev) => Math.max(0, prev - 1))
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return

    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)

      if (error) throw error

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!user) return

    try {
      const { error } = await supabase.from("notifications").delete().eq("id", id)

      if (error) throw error

      const notificationToDelete = notifications.find((n) => n.id === id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))

      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error deleting notification:", error)
    }
  }

  const clearAllNotifications = async () => {
    if (!user || notifications.length === 0) return

    try {
      const { error } = await supabase.from("notifications").delete().eq("user_id", user.id)

      if (error) throw error

      setNotifications([])
      setUnreadCount(0)
    } catch (error) {
      console.error("Error clearing notifications:", error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return <FileText className="h-4 w-4 text-blue-500" />
      case "grade":
        return <Check className="h-4 w-4 text-green-500" />
      case "comment":
        return <MessageSquare className="h-4 w-4 text-purple-500" />
      case "course":
        return <Calendar className="h-4 w-4 text-amber-500" />
      case "message":
        return <Mail className="h-4 w-4 text-cyan-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Info className="h-4 w-4 text-gray-500" />
    }
  }

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "all") return true
    if (activeTab === "unread") return !notification.read
    return notification.type.includes(activeTab)
  })

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
          <span className="sr-only">Notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="font-semibold">Notifications</h4>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-auto py-1 px-2 text-xs">
                Mark all as read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllNotifications}
                className="h-auto py-1 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                Clear all
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b">
            <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Unread
              </TabsTrigger>
              <TabsTrigger
                value="assignment"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Assignments
              </TabsTrigger>
              <TabsTrigger
                value="grade"
                className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
              >
                Grades
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="h-[400px]">
            <TabsContent value={activeTab} className="m-0">
              {filteredNotifications.length > 0 ? (
                <div className="divide-y">
                  <AnimatePresence initial={false}>
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className={cn("flex flex-col gap-1 p-4 transition-colors", !notification.read && "bg-muted/50")}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id)
                          }
                          if (notification.link) {
                            setOpen(false)
                          }
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}
                            <h5 className="font-medium">{notification.title}</h5>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                            >
                              <X className="h-3 w-3" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                        {notification.link && (
                          <div className="mt-2">
                            <Link
                              href={notification.link}
                              className="text-xs text-primary hover:underline"
                              onClick={() => setOpen(false)}
                            >
                              View details
                            </Link>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center p-4 text-center">
                  <div>
                    <Bell className="mx-auto h-10 w-10 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}
