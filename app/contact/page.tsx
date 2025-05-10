import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="container mx-auto py-12 space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">Contact Us</h1>
        <p className="text-xl text-muted-foreground">
          Have questions or feedback? We'd love to hear from you.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
            <p className="text-muted-foreground">
              Our team is here to help with any questions you may have about
              ትምህርት ቤት. Fill out the form and we'll get back to you as soon as
              possible.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Email</h3>
                <p className="text-muted-foreground">support@ትምህርት ቤት.com</p>
                <p className="text-muted-foreground">info@ትምህርት ቤት.com</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Phone</h3>
                <p className="text-muted-foreground">+1 (555) 123-4567</p>
                <p className="text-muted-foreground">+1 (555) 987-6543</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Address</h3>
                <p className="text-muted-foreground">123 Education Lane</p>
                <p className="text-muted-foreground">Learning City, ED 54321</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium">Hours</h3>
                <p className="text-muted-foreground">
                  Monday - Friday: 9am - 5pm
                </p>
                <p className="text-muted-foreground">
                  Saturday - Sunday: Closed
                </p>
              </div>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>
              Fill out the form below and we'll get back to you
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="first-name" className="text-sm font-medium">
                    First Name
                  </label>
                  <Input id="first-name" placeholder="John" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="last-name" className="text-sm font-medium">
                    Last Name
                  </label>
                  <Input id="last-name" placeholder="Doe" />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input id="subject" placeholder="How can we help you?" />
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Your message here..."
                  className="min-h-32"
                />
              </div>

              <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <div className="text-left p-6 border rounded-lg">
            <h3 className="font-bold mb-2">How do I reset my password?</h3>
            <p className="text-muted-foreground">
              You can reset your password by clicking on the "Forgot Password"
              link on the login page and following the instructions sent to your
              email.
            </p>
          </div>
          <div className="text-left p-6 border rounded-lg">
            <h3 className="font-bold mb-2">
              Can I use ትምህርት ቤት on mobile devices?
            </h3>
            <p className="text-muted-foreground">
              Yes, ትምህርት ቤት is fully responsive and works on all modern mobile
              devices and tablets.
            </p>
          </div>
          <div className="text-left p-6 border rounded-lg">
            <h3 className="font-bold mb-2">How do I enroll in a course?</h3>
            <p className="text-muted-foreground">
              Navigate to the Courses section, find the course you're interested
              in, and click the "Enroll" button.
            </p>
          </div>
          <div className="text-left p-6 border rounded-lg">
            <h3 className="font-bold mb-2">Is my data secure?</h3>
            <p className="text-muted-foreground">
              Yes, we use industry-standard encryption and security practices to
              ensure your data is safe and private.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center space-y-4 max-w-3xl mx-auto pt-8">
        <h2 className="text-3xl font-bold">Ready to get started?</h2>
        <p className="text-lg text-muted-foreground">
          Join thousands of students and educators already using ትምህርት ቤት.
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/register">
            <Button size="lg">Sign Up Now</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
