"use client";

// import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import ToastViewport, { type ToastItem, type ToastVariant } from "@/components/ui/Toast";

interface ShowToastOptions {
  title: string;
  description?: string;
  variant?: ToastVariant;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (options: ShowToastOptions) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = "info", durationMs = DEFAULT_DURATION_MS }: ShowToastOptions) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setToasts((prev) => [...prev, { id, title, description, variant }]);

      const timeout = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
        timeoutsRef.current.delete(id);
      }, durationMs);
      timeoutsRef.current.set(id, timeout);
    },
    []
  );

  return (
    // <ToastContext.Provider value={{ showToast, dismissToast }}>
    <ToastContext.Provider value={useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast])}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}