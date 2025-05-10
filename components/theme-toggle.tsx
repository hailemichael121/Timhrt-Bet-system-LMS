"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  const isDark = theme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 px-4 py-2 rounded-lg w-100 h-8 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 ease-in-out"
    >
      {isDark ? (
        <>
          <Moon className="h-[1.2rem] w-[1.2rem]" />
          <span className="text-sm">Dark</span>
        </>
      ) : (
        <>
          <Sun className="h-[1.2rem] w-[1.2rem]" />
          <span className="text-sm">Light</span>
        </>
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
