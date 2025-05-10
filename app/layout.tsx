// RootLayout.tsx

import type React from "react";
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-provider";
import { GlobalLoading } from "@/components/ui/global-loading";
import { ThemeToggle } from "@/components/theme-toggle"; // 🆕 import the new toggle
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MockAuthProvider } from "@/context/MockAuthProvider";
import ogImage from "@/public/book-logo-dark.png";
import favicon from "@/public/book-logo-light.png";

// app/layout.tsx
const AuthWrapper =
  process.env.NODE_ENV === "development" ? MockAuthProvider : AuthProvider;

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ትምህርት ቤት - Student Management System",
  description: "A comprehensive platform for educational institutions",
  icons: {
    icon: favicon.src,
    shortcut: favicon.src,
    apple: favicon.src,
  },
  metadataBase: new URL("https://scholarsphere.vercel.app"),
  openGraph: {
    title: "ትምህርት ቤት - Student Management System",
    description: "A comprehensive platform for educational institutions",
    url: "https://scholarsphere.vercel.app",
    siteName: "ትምህርት ቤት",
    images: [
      {
        url: ogImage.src,
        width: 1200,
        height: 630,
      },
    ],
    locale: "en-US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ትምህርት ቤት - Student Management System",
    description: "A comprehensive platform for educational institutions",
    images: [ogImage.src],
    creator: "@scholarsphere",
    site: "@scholarsphere",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${poppins.variable} ${inter.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Suspense fallback={<LoadingSpinner />}>
            <AuthWrapper>
              <GlobalLoading />
              {/* Main content */}
              {children}
              <Toaster />
            </AuthWrapper>
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  );
}
