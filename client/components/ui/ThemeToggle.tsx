"use client";

import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/providers/theme-provider";

export default function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={
        className ??
        "inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
      }
    >
      {theme === "dark" ? <FiSun size={22} /> : <FiMoon size={22} />}
    </button>
  );
}