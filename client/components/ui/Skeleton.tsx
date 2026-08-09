import { cn } from "@/lib/utils";

export default function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-md bg-muted motion-reduce:animate-none", className)} aria-hidden="true" />;
}