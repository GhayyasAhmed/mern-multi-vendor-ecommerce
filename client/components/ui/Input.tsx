"use client";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  wrapperClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, required, id, className, wrapperClassName, ...rest }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className={cn("w-full", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
            {required && (
              <span className="ml-0.5 text-error" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={cn(errorId, hintId) || undefined}
            className={cn(
              "block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder-muted-foreground shadow-xs transition-colors",
              "focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-primary",
              "disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted",
              error && "border-error focus:ring-error focus:border-error",
              leftIcon && "pl-9",
              rightIcon && "pr-9",
              className
            )}
            {...rest}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {rightIcon}
            </span>
          )}
        </div>
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
Input.displayName = "Input";

export default Input;