"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AiOutlineClose } from "react-icons/ai";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeOnBackdropClick?: boolean;
}

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  );
}

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  closeOnBackdropClick = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const titleId = "modal-title";
  const descId = "modal-description";

  // Focus management: remember what was focused before opening, move focus
  // into the dialog on open, trap Tab within it, restore focus on close.
  useEffect(() => {
    if (!open) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const node = dialogRef.current;
    const focusables = node ? getFocusable(node) : [];
    (focusables[0] ?? node)?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !node) return;

      const items = getFocusable(node);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      document.body.style.overflow = originalOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 transition-opacity"
        aria-hidden="true"
        onClick={closeOnBackdropClick ? onClose : undefined}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={cn(
          "relative z-10 w-full max-w-md rounded-lg border border-border bg-surface shadow-lg outline-none",
          "animate-[modal-in_0.15s_ease-out] motion-reduce:animate-none",
          className
        )}
      >
        {title && (
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id={titleId} className="text-base font-semibold text-foreground">
                {title}
              </h2>
              {description && (
                <p id={descId} className="mt-1 text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground cursor-pointer"
            >
              <AiOutlineClose size={18} />
            </button>
          </div>
        )}
        {children && <div className="px-5 py-4">{children}</div>}
        {footer && <div className="flex justify-end gap-3 border-t border-border px-5 py-4">{footer}</div>}
      </div>
      <style jsx global>{`
        @keyframes modal-in {
          from {
            opacity: 0;
            transform: translateY(4px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body
  );
}