import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4", className)}>
      {icon && (
        <div
          className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}
      <p className="text-[16px] font-medium text-foreground">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4 text-sm font-medium text-primary hover:underline">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && !actionHref && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 min-h-11 text-sm font-medium text-primary hover:underline cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}