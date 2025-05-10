"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
// import { BookThemeToggle } from "@/components/theme-toggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLogin = pathname.includes("login");

  return (
    <div className="min-h-screen overflow-hidden">
      {/* Decorative falling books - top portion */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`book-top-${i}`}
            className="absolute h-4 rounded opacity-80 dark:opacity-40"
            style={{
              width: Math.random() * 60 + 20,
              background: `hsl(${Math.random() * 30 + 200}, 70%, 60%)`,
              left: `${Math.random() * 100}%`,
            }}
            initial={{ top: -100, rotate: Math.random() * 30 - 15 }}
            animate={{
              top: ["0%", "100%"],
              x: [0, Math.random() * 100 - 50],
              rotate: [Math.random() * 30 - 15, Math.random() * 360 - 180],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Number.POSITIVE_INFINITY,
              delay: Math.random() * 10,
              ease: "linear",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 grid min-h-screen grid-cols-1 overflow-hidden md:grid-cols-3">
        <div className="hidden h-full bg-muted p-10 text-white md:flex md:flex-col md:justify-between">
          <div>
            <Link href="/">
              <h1 className="text-2xl font-bold">Student Management System</h1>
            </Link>
            <p className="mt-2 text-lg">
              Manage your education journey with ease
            </p>
          </div>

          <motion.div
            className="relative h-56 w-56"
            animate={{
              rotateY: [0, 10, 0, -10, 0],
              y: [0, -5, 0, -5, 0],
            }}
            transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY }}
          >
            <motion.div
              className="absolute bottom-0 left-6 h-32 w-24 rounded-lg bg-primary/80 shadow-lg"
              initial={{ rotateZ: -15 }}
              animate={{ rotateZ: [-15, -17, -15] }}
              transition={{
                duration: 2,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute bottom-6 left-0 h-32 w-28 rounded-lg bg-primary/90 shadow-lg"
              initial={{ rotateZ: -5 }}
              animate={{ rotateZ: [-5, -7, -5] }}
              transition={{
                duration: 2.5,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
            <motion.div
              className="absolute bottom-12 left-12 h-36 w-32 rounded-lg bg-primary shadow-lg"
              initial={{ rotateZ: 5 }}
              animate={{ rotateZ: [5, 7, 5] }}
              transition={{
                duration: 3,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          </motion.div>

          <div>
            <p className="text-sm text-gray-100">
              © {new Date().getFullYear()} Student Management System
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center p-8 md:col-span-2">
          <div className="absolute top-4 right-4">
            <ThemeToggle />
          </div>

          <div className="mx-auto w-full max-w-md space-y-6">
            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-bold">
                {isLogin ? "Welcome back" : "Create an account"}
              </h1>
              <p className="text-muted-foreground">
                {isLogin
                  ? "Enter your credentials to sign in"
                  : "Fill in the form to create your account"}
              </p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
                transition={{ duration: 0.3 }}
              >
                {children}
              </motion.div>
            </AnimatePresence>

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <Button variant="link" asChild className="ml-1 p-0">
                  <Link href={isLogin ? "/register" : "/login"}>
                    {isLogin ? "Sign up" : "Sign in"}
                  </Link>
                </Button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
