"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

type ConfirmVariant = "default" | "danger";

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: ConfirmVariant;
  /** For especially destructive actions: user must type this text to enable Confirm. */
  requireTypedConfirmation?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const DEFAULT_OPTIONS: Required<Pick<ConfirmOptions, "confirmLabel" | "cancelLabel" | "variant">> = {
  confirmLabel: "Confirm",
  cancelLabel: "Cancel",
  variant: "default",
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions) => {
    setOptions(opts);
    setTypedValue("");
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (value: boolean) => {
    resolverRef.current?.(value);
    resolverRef.current = null;
    setOptions(null);
  };

  const merged = options ? { ...DEFAULT_OPTIONS, ...options } : null;
  const requiresTyping = Boolean(merged?.requireTypedConfirmation);
  const canConfirm = !requiresTyping || typedValue === merged?.requireTypedConfirmation;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <Modal
        open={Boolean(merged)}
        onClose={() => settle(false)}
        title={merged?.title}
        description={merged?.description}
        footer={
          merged ? (
            <>
              <Button variant="outline" onClick={() => settle(false)}>
                {merged.cancelLabel}
              </Button>
              <Button
                variant={merged.variant === "danger" ? "danger" : "primary"}
                disabled={!canConfirm}
                onClick={() => settle(true)}
              >
                {merged.confirmLabel}
              </Button>
            </>
          ) : null
        }
      >
        {requiresTyping && merged && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">
              Type <span className="font-semibold text-foreground">{merged.requireTypedConfirmation}</span> to
              confirm.
            </p>
            <input
              autoFocus
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              className="block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary"
            />
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): (options: ConfirmOptions) => Promise<boolean> {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}