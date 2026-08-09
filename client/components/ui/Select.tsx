"use client";
import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, required, id, className, children, ...rest }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = error ? `${selectId}-error` : undefined;
    const hintId = hint ? `${selectId}-hint` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
            {required && (
              <span className="ml-0.5 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          required={required}
          aria-invalid={Boolean(error)}
          aria-describedby={cn(errorId, hintId) || undefined}
          className={cn(
            "block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-xs transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
            error && "border-error focus:ring-error focus:border-error",
            className
          )}
          {...rest}
        >
          {children}
        </select>
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
Select.displayName = "Select";

export default Select;