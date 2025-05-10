"use client";

import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Users,
  BookText,
  CheckCircle,
  BarChart,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { PageTransition } from "@/components/page-transition";
import { FeatureCard } from "@/components/feature-card";
import { HeroAnimation } from "@/components/animations/hero-animation";
import { motion } from "framer-motion";
import BookLogo from "@/components/BookLogo";

export default function Home() {
  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
        <header className="container mx-auto py-6 flex justify-between items-center">
          <div className="flex items-center gap-2 w-100 h-100">
            <BookLogo />
            <h1 className="text-2xl font-bold">ትምህርት ቤት</h1>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="outline">Log In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto py-12">
          <section className="py-12 md:py-24 lg:py-32 flex flex-col md:flex-row items-center gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 flex-1"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
                Modern Learning Management System
              </h1>
              <p className="text-xl text-muted-foreground max-w-[600px]">
                A comprehensive platform for educational institutions to manage
                courses, track student progress, and facilitate seamless
                learning experiences.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto"
                  >
                    Log In
                  </Button>
                </Link>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>No credit card required</span>
              </div>
            </motion.div>
            <div className="flex-1 flex justify-center">
              <HeroAnimation />
            </div>
          </section>

          <section className="py-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Everything You Need</h2>
              <p className="text-muted-foreground max-w-[600px] mx-auto">
                ትምህርት ቤት provides all the tools needed for effective teaching
                and learning in one integrated platform.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<GraduationCap className="h-10 w-10" />}
                title="Course Management"
                description="Create, edit, and manage courses with ease. Assign teachers and enroll students."
              />
              <FeatureCard
                icon={<Users className="h-10 w-10" />}
                title="Student Tracking"
                description="Monitor student progress, attendance, and performance with detailed analytics."
              />
              <FeatureCard
                icon={<BookText className="h-10 w-10" />}
                title="Assignment Management"
                description="Create assignments, grade submissions, and provide feedback to students."
              />
              <FeatureCard
                icon={<BarChart className="h-10 w-10" />}
                title="Analytics Dashboard"
                description="Visualize student performance and identify areas for improvement with powerful analytics."
              />
              <FeatureCard
                icon={<MessageSquare className="h-10 w-10" />}
                title="Communication Tools"
                description="Facilitate discussions between students and teachers with integrated messaging."
              />
              <FeatureCard
                icon={<CheckCircle className="h-10 w-10" />}
                title="Plagiarism Detection"
                description="Ensure academic integrity with built-in plagiarism detection for assignments."
              />
            </div>
          </section>

          <section className="py-12 bg-muted/30 rounded-lg p-8 my-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-4">How It Works</h2>
              <p className="text-muted-foreground max-w-[600px] mx-auto">
                Get started with ትምህርት ቤት in just a few simple steps.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Create an Account</h3>
                <p className="text-muted-foreground">
                  Sign up as a student, teacher, or administrator.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Set Up Your Profile</h3>
                <p className="text-muted-foreground">
                  Complete your profile and verify your email address.
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="text-xl font-bold mb-2">Start Learning</h3>
                <p className="text-muted-foreground">
                  Enroll in courses, submit assignments, and track your
                  progress.
                </p>
              </div>
            </div>
          </section>

          <section className="py-12 text-center">
            <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
            <p className="text-muted-foreground max-w-[600px] mx-auto mb-8">
              Join thousands of students and educators already using ትምህርት ቤት to
              enhance their learning experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg">Create an Account</Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Log In
                </Button>
              </Link>
            </div>
          </section>
        </main>

        <footer className="border-t bg-muted/50">
          <div className="container mx-auto py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <span className="font-semibold">ትምህርት ቤት</span>
              </div>
              <p className="text-sm text-muted-foreground">
                © {new Date().getFullYear()} ትምህርት ቤት. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
