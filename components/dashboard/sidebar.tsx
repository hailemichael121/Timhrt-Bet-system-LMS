"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  FileText,
  PlusCircle,
  BarChart2,
  UserCircle,
  GraduationCap,
} from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import BookLogo from "../BookLogo";

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user, profile } = useCurrentUser();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUnreadNotifications();
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
          () => {
            fetchUnreadNotifications();
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchUnreadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  const fetchUnreadNotifications = async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (!error && count !== null) {
      setUnreadNotifications(count);
    }
  };

  // Define routes based on user role
  const studentRoutes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      name: "Assignments",
      href: "/dashboard/assignments",
      icon: FileText,
    },
    {
      name: "Grades",
      href: "/dashboard/grades",
      icon: BarChart2,
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: UserCircle,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const teacherRoutes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      name: "Create Course",
      href: "/dashboard/courses/create",
      icon: PlusCircle,
    },
    {
      name: "Students",
      href: "/dashboard/students",
      icon: Users,
    },
    {
      name: "Assignments",
      href: "/dashboard/assignments",
      icon: FileText,
    },
    {
      name: "Grading",
      href: "/dashboard/grading",
      icon: BarChart2,
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: UserCircle,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  const adminRoutes = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Users",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      name: "Courses",
      href: "/dashboard/courses",
      icon: BookOpen,
    },
    {
      name: "Enrollment Requests",
      href: "/dashboard/admin/enrollment-requests",
      icon: PlusCircle,
      badge: true,
    },
    {
      name: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: BarChart2,
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageSquare,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
    },
  ];

  // Determine which routes to show based on user role
  const routes =
    user?.role === "admin"
      ? adminRoutes
      : user?.role === "teacher"
      ? teacherRoutes
      : studentRoutes;

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col border-r bg-muted/40 transition-all duration-300",
        isExpanded ? "w-64" : "w-16"
      )}
    >
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <BookLogo />{" "}
          {isExpanded && <span className="font-poppins">ትምህርት ቤት</span>}
        </Link>
        <button
          onClick={toggleSidebar}
          className="ml-auto rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-300 ${
              isExpanded ? "rotate-0" : "rotate-180"
            }`}
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
                pathname === route.href && "bg-muted text-foreground",
                !isExpanded && "justify-center px-2"
              )}
            >
              <route.icon className="h-4 w-4" />
              {isExpanded && (
                <span className="flex-1 truncate">{route.name}</span>
              )}
              {isExpanded && route.badge && unreadNotifications > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {unreadNotifications}
                </Badge>
              )}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto p-4">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-card p-4 text-card-foreground shadow-sm",
            !isExpanded && "justify-center p-2"
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.avatar_url || ""} />
            <AvatarFallback>
              {getInitials(
                profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : user?.email || "User"
              )}
            </AvatarFallback>
          </Avatar>
          {isExpanded && (
            <div className="grid gap-1">
              <p className="text-sm font-medium leading-none">
                {user?.role === "student"
                  ? "Student"
                  : user?.role === "teacher"
                  ? "Teacher"
                  : "Administrator"}
              </p>
              <p className="text-xs text-muted-foreground truncate max-w-[140px]">
                {profile?.first_name && profile?.last_name
                  ? `${profile.first_name} ${profile.last_name}`
                  : user?.email || "User"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
