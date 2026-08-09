"use client";
import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, required, id, className, ...rest }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
            {required && (
              <span className="ml-0.5 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            "block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder-muted-foreground shadow-xs transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
            error && "border-error focus:ring-error focus:border-error",
            className
          )}
          {...rest}
        />
        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-sm text-error">
            {error}
          </p>
        ) : hint ? (
          <p id={hintId} className="mt-1.5 text-sm text-muted-foreground">
            {hint}
          </p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export default Textarea;