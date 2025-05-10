import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Users,
  Award,
  GraduationCap,
  BarChart4,
  Clock,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">About ትምህርት ቤት</h1>
        <p className="text-xl text-muted-foreground">
          A comprehensive student management system designed for modern
          educational institutions
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <h2 className="text-3xl font-bold">
            Empowering Education Through Technology
          </h2>
          <p className="text-lg text-muted-foreground">
            ትምህርት ቤት is a state-of-the-art student management system that
            streamlines administrative tasks, enhances communication between
            students and teachers, and provides powerful analytics to improve
            educational outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get Started
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Log In
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative h-[300px] rounded-lg overflow-hidden shadow-xl">
          <Image
            src="/placeholder.svg?height=600&width=800"
            alt="ትምህርት ቤት Dashboard"
            fill
            className="object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="space-y-1">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>For Students</CardTitle>
            <CardDescription>
              Manage your academic journey with ease
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Track assignments and submissions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Enroll in courses and view grades</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Communicate with instructors and peers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Receive personalized course recommendations</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>For Teachers</CardTitle>
            <CardDescription>Streamline your teaching workflow</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Create and manage courses</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Grade assignments with detailed feedback</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Track student performance with analytics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Facilitate discussions and announcements</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-1">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>For Administrators</CardTitle>
            <CardDescription>
              Comprehensive institutional oversight
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Manage users, roles, and permissions</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Monitor enrollment and academic metrics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Generate reports and analytics</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Configure system settings and integrations</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="features" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="features">Key Features</TabsTrigger>
          <TabsTrigger value="technology">Technology</TabsTrigger>
          <TabsTrigger value="security">Security & Privacy</TabsTrigger>
        </TabsList>
        <TabsContent value="features" className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <BookOpen className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Course Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Create, organize, and manage courses with comprehensive tools
                  for curriculum planning and delivery.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Award className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Grading System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Flexible grading options with customizable rubrics, feedback
                  tools, and grade analytics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <BarChart4 className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Visualize student performance, course engagement, and
                  institutional metrics with powerful analytics.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Assignment Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manage assignments, deadlines, and submissions with automated
                  reminders and status tracking.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="technology" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Built with Modern Technologies</CardTitle>
              <CardDescription>
                ትምህርት ቤት leverages cutting-edge technologies to provide a fast,
                reliable, and secure experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium">Next.js</h3>
                  <p className="text-sm text-muted-foreground">
                    React framework for production
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium">Supabase</h3>
                  <p className="text-sm text-muted-foreground">
                    Open source Firebase alternative
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium">TypeScript</h3>
                  <p className="text-sm text-muted-foreground">
                    Type-safe JavaScript
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <Zap className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="font-medium">Tailwind CSS</h3>
                  <p className="text-sm text-muted-foreground">
                    Utility-first CSS framework
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="security" className="space-y-6 pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>
                ትምህርት ቤት prioritizes the security and privacy of your data with
                industry-standard practices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Data Encryption
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    All data is encrypted at rest and in transit using
                    industry-standard encryption protocols.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Role-Based Access Control
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Granular permissions ensure users can only access the data
                    they need for their role.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Regular Backups
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Automated backups ensure your data is safe and can be
                    restored if needed.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center">
                    <Shield className="h-5 w-5 mr-2 text-primary" />
                    Compliance Ready
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Designed with educational data privacy regulations in mind,
                    including FERPA compliance.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
        <h2 className="text-3xl font-bold">
          Ready to transform your educational institution?
        </h2>
        <p className="text-lg text-muted-foreground">
          Join thousands of institutions worldwide that trust ትምህርት ቤት to manage
          their educational processes.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/register">
            <Button size="lg">Get Started Today</Button>
          </Link>
          <Link href="/contact">
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
