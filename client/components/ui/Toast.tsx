"use client";

import { useEffect, useState } from "react";
import { AiOutlineCheckCircle, AiOutlineCloseCircle, AiOutlineInfoCircle, AiOutlineWarning, AiOutlineClose } from "react-icons/ai";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ReactNode; className: string }> = {
  success: {
    icon: <AiOutlineCheckCircle size={20} />,
    className: "border-success/30 bg-success-bg text-success",
  },
  error: {
    icon: <AiOutlineCloseCircle size={20} />,
    className: "border-error/30 bg-error-bg text-error",
  },
  warning: {
    icon: <AiOutlineWarning size={20} />,
    className: "border-warning/30 bg-warning-bg text-warning",
  },
  info: {
    icon: <AiOutlineInfoCircle size={20} />,
    className: "border-info/30 bg-info-bg text-info",
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: string) => void }) {
  // Mount with opacity-0 then flip to opacity-100 on the next frame so the
  // entrance is an actual transition rather than appearing instantly.
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const { icon, className } = VARIANT_STYLES[toast.variant];

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border bg-surface px-4 py-3 shadow-lg transition-all duration-200 motion-reduce:transition-none",
        entered ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
        className
      )}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
      >
        <AiOutlineClose size={16} />
      </button>
    </div>
  );
}

export default function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4 800px:inset-x-auto 800px:right-4 800px:items-end"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}