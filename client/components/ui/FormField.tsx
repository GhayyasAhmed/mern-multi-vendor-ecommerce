"use client";
import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

// For custom controls (checkbox/radio groups, file pickers, star ratings, etc.)
// that need the same label/error/hint layout as Input/Select/Textarea but
// can't use a native <input>/<select>/<textarea> directly.
export default function FormField({
  label,
  error,
  hint,
  required,
  htmlFor,
  className,
  children,
}: FormFieldProps) {
  const generatedId = useId();
  const fieldId = htmlFor ?? generatedId;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <label htmlFor={fieldId} className="mb-1.5 block text-sm font-medium text-foreground">
          {label}
          {required && (
            <span className="ml-0.5 text-error" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-sm text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}