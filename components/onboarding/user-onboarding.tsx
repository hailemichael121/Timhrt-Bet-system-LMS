"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/hooks/use-current-user";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  User,
  GraduationCap,
  School,
  CheckCircle,
} from "lucide-react";
import { ProfileImageUpload } from "@/components/profile/profile-image-upload";

export function UserOnboarding() {
  const { user, refreshProfile } = useCurrentUser();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    role: user?.role || "student",
    bio: "",
    student_id: "",
    department: "",
    interests: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleNext = () => {
    if (step === 1 && (!formData.first_name || !formData.last_name)) {
      toast({
        title: "Required fields",
        description: "Please fill in your first and last name",
        variant: "destructive",
      });
      return;
    }

    if (step === 2 && formData.role === "student" && !formData.student_id) {
      toast({
        title: "Student ID required",
        description: "Please enter your student ID",
        variant: "destructive",
      });
      return;
    }

    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Update user profile
      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: formData.role,
          bio: formData.bio,
          student_id: formData.role === "student" ? formData.student_id : null,
          department: formData.department,
          interests: formData.interests,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      // Create welcome notification
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Welcome to ትምህርት ቤት!",
        message:
          "Thank you for completing your profile. Get started by exploring your dashboard.",
        type: "welcome",
        read: false,
      });

      // Refresh profile data
      await refreshProfile();

      toast({
        title: "Profile completed",
        description:
          "Your profile has been set up successfully. Welcome to ትምህርት ቤት!",
      });

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Error updating profile:", error.message);
      toast({
        title: "Error",
        description: error.message || "Failed to complete onboarding",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "Personal Information",
      description: "Let's start with your basic information",
      icon: <User className="h-6 w-6" />,
    },
    {
      title: "Role & Identification",
      description: "Tell us about your role in the institution",
      icon: <GraduationCap className="h-6 w-6" />,
    },
    {
      title: "Additional Details",
      description: "Share more about yourself",
      icon: <School className="h-6 w-6" />,
    },
    {
      title: "Profile Picture",
      description: "Add a profile picture",
      icon: <User className="h-6 w-6" />,
    },
    {
      title: "All Set!",
      description: "You're ready to get started",
      icon: <CheckCircle className="h-6 w-6" />,
    },
  ];

  return (
    <div className="container max-w-md mx-auto py-10">
      <div className="mb-8 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-bold">Welcome to ትምህርት ቤት</h1>
        <p className="text-muted-foreground">
          Let's set up your profile to get started
        </p>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center">
          {steps.map((s, i) => (
            <div
              key={i}
              className={`flex flex-col items-center ${
                i + 1 === step
                  ? "text-primary"
                  : i + 1 < step
                  ? "text-primary/70"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center mb-1 ${
                  i + 1 === step
                    ? "bg-primary text-primary-foreground"
                    : i + 1 < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1 < step ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <div className="hidden md:block text-xs">{steps[i].title}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 h-1 w-full bg-muted overflow-hidden rounded-full">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {steps[step - 1].icon}
            <div>
              <CardTitle>{steps[step - 1].title}</CardTitle>
              <CardDescription>{steps[step - 1].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name *</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name *</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Your Role *</Label>
                    <RadioGroup
                      value={formData.role}
                      onValueChange={handleRoleChange}
                      className="flex flex-col space-y-1"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="student" />
                        <Label htmlFor="student" className="cursor-pointer">
                          Student
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="teacher" />
                        <Label htmlFor="teacher" className="cursor-pointer">
                          Teacher
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="admin" id="admin" />
                        <Label htmlFor="admin" className="cursor-pointer">
                          Administrator
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {formData.role === "student" && (
                    <div className="space-y-2">
                      <Label htmlFor="student_id">Student ID *</Label>
                      <Input
                        id="student_id"
                        name="student_id"
                        value={formData.student_id}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="department">Department/Faculty</Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      placeholder="Tell us a bit about yourself"
                      value={formData.bio}
                      onChange={handleChange}
                      className="min-h-32"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="interests">Interests</Label>
                    <Textarea
                      id="interests"
                      name="interests"
                      placeholder="What subjects or topics are you interested in?"
                      value={formData.interests}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4 flex justify-center py-4">
                  <ProfileImageUpload />
                </div>
              )}

              {step === 5 && (
                <div className="space-y-4 text-center py-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">You're all set!</h3>
                    <p className="text-muted-foreground">
                      Thank you for completing your profile. Click "Complete" to
                      start using ትምህርት ቤት.
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            Back
          </Button>
          {step < steps.length ? (
            <Button onClick={handleNext}>Next</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Completing..." : "Complete"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
