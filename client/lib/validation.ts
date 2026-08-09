import type { KeyboardEvent } from "react";

const CONTROL_KEYS = [
  "Backspace", "Delete", "Tab", "Escape", "Enter",
  "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End",
];

/** Blocks keystrokes that would produce a non-digit in an integer field (qty, stock, phone). */
export function blockNonIntegerKeys(e: KeyboardEvent<HTMLInputElement>): void {
  if (CONTROL_KEYS.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
}

/** Blocks keystrokes that would produce an invalid character in a price field. */
export function blockNonPriceKeys(e: KeyboardEvent<HTMLInputElement>): void {
  if (CONTROL_KEYS.includes(e.key)) return;
  if (e.ctrlKey || e.metaKey) return;
  const target = e.currentTarget;
  if (e.key === "." && !target.value.includes(".")) return;
  if (!/^[0-9]$/.test(e.key)) e.preventDefault();
}

export function sanitizeDigitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function sanitizePriceString(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  return cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  label: "Very weak" | "Weak" | "Fair" | "Good" | "Strong";
  color: "error" | "warning" | "info" | "success";
  requirements: { minLength: boolean; hasUpper: boolean; hasLower: boolean; hasNumber: boolean; hasSymbol: boolean };
}

export function getPasswordStrength(password: string): PasswordStrength {
  const requirements = {
    minLength: password.length >= 8,
    hasUpper: /[A-Z]/.test(password),
    hasLower: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
  const passed = Object.values(requirements).filter(Boolean).length;
  const score = (password.length === 0 ? 0 : Math.min(4, Math.max(1, passed - 1))) as PasswordStrength["score"];
  const meta: Record<PasswordStrength["score"], Pick<PasswordStrength, "label" | "color">> = {
    0: { label: "Very weak", color: "error" },
    1: { label: "Weak", color: "error" },
    2: { label: "Fair", color: "warning" },
    3: { label: "Good", color: "info" },
    4: { label: "Strong", color: "success" },
  };
  return { score, requirements, ...meta[score] };
}

const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateImageFile(file: File, maxSizeBytes: number = MAX_IMAGE_SIZE_BYTES): FileValidationResult {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: "Please upload a JPG, PNG, WEBP, or GIF image." };
  }
  if (file.size > maxSizeBytes) {
    return { valid: false, error: `Image must be smaller than ${Math.round(maxSizeBytes / (1024 * 1024))}MB.` };
  }
  return { valid: true };
}

export function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}