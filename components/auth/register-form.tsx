"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
  role: z.enum(["student", "teacher"], {
    required_error: "Please select a role.",
  }),
  studentId: z.string().optional(),
});

export function RegisterForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      role: "student",
      studentId: "",
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    try {
      setIsLoading(true);
      // DEVELOPMENT BYPASS
      const mockAuth = await mockSignIn();
      if (mockAuth) {
        router.push("/dashboard");
        return;
      }
      // 1. Sign up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            student_id: values.role === "student" ? values.studentId : null,

            first_name: values.firstName,
            last_name: values.lastName,
            role: values.role,
          },
        },
      });

      if (authError) throw authError;

      // 2. Send confirmation email
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: values.email,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
        },
      });

      if (signInError) throw signInError;

      // 3. Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user?.id,
        first_name: values.firstName,
        last_name: values.lastName,
        email: values.email,
        role: values.role,
        student_id: values.role === "student" ? values.studentId : null,
        onboarding_completed: false,
      });

      if (profileError) throw profileError;

      setTimeout(() => {
        router.push("/onboarding");
      }, 7000);
      setRegistrationComplete(true);
      toast({
        title: "Registration Successful",
        description: "Please check your email to verify your account.",
        variant: "default",
      });
      router.refresh(); // Redirect to login after 3 seconds
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  if (registrationComplete) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-4"
      >
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold">Registration Complete!</h3>
        <p className="text-muted-foreground">
          Please check your email to verify your account. You will be redirected
          to the login page shortly.
        </p>
        <Button className="w-full" onClick={() => router.push("/login")}>
          Go to Login
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={`step-${currentStep}`} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="step-1" disabled>
            Account
          </TabsTrigger>
          <TabsTrigger value="step-2" disabled>
            Role
          </TabsTrigger>
          <TabsTrigger value="step-3" disabled>
            Confirm
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {currentStep === 1 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="••••••••"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3"
                          onClick={togglePasswordVisibility}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Password must be at least 8 characters long.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="button"
                className="w-full"
                onClick={() => setCurrentStep(2)}
              >
                Next
              </Button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>I am a...</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex flex-col space-y-1"
                      >
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="student" />
                          </FormControl>
                          <FormLabel className="font-normal">Student</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="teacher" />
                          </FormControl>
                          <FormLabel className="font-normal">Teacher</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {role === "student" && (
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student ID</FormLabel>
                      <FormControl>
                        <Input placeholder="S12345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => setCurrentStep(3)}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Information</CardTitle>
                  <CardDescription>
                    Please confirm your details before creating your account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">First Name</p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("firstName")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Name</p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("lastName")}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {form.getValues("email")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Role</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {form.getValues("role")}
                    </p>
                  </div>
                  {form.getValues("role") === "student" && (
                    <div>
                      <p className="text-sm font-medium">Student ID</p>
                      <p className="text-sm text-muted-foreground">
                        {form.getValues("studentId")}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setCurrentStep(2)}
                >
                  Back
                </Button>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </form>
      </Form>
    </div>
  );
}
async function mockSignIn() {
  // Simulate a successful sign-in
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 2000);
  });
}
export default RegisterForm;
// This is a mock function to simulate the sign-in process.
// In a real application, you would replace this with actual authentication logic.
// It returns a promise that resolves after 2 seconds, simulating a network request.
// You can customize the delay and the resolved value as needed for your testing purposes.
// In a real application, you would replace this with actual authentication logic.
// It returns a promise that resolves after 2 seconds, simulating a network request.
