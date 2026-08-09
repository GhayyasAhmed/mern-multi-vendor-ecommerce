import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "error" | "info" | "primary";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  primary: "bg-secondary text-secondary-foreground",
};

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dotted?: boolean;
}

export default function Badge({ variant = "neutral", children, className, dotted = false }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {dotted && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}