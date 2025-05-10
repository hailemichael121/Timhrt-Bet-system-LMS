// components/BookLogo.tsx
"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function BookLogo() {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse" />;
  }

  return (
    <Image
      src={
        resolvedTheme === "dark"
          ? "/book-logo-light.png"
          : "/book-logo-dark.png"
      }
      alt="Book Logo"
      width={100}
      height={100}
      className="rounded-full"
      priority
    />
  );
}

export default BookLogo;
