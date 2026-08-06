import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query/react";

interface ApiErrorPayload {
  success?: boolean;
  message?: string;
}

export function getErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  if (!error) return fallback;

  const rtkError = error as FetchBaseQueryError | SerializedError;

  if ("status" in rtkError) {
    const data = rtkError.data as ApiErrorPayload | undefined;
    if (data?.message) return data.message;
    if (typeof rtkError.status === "number") {
      return `Request failed (${rtkError.status}). Please try again.`;
    }
    return fallback;
  }

  if ("message" in rtkError && rtkError.message) {
    return rtkError.message;
  }

  return fallback;
}

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export class AvatarTooLargeError extends Error {}

export function readFileAsBase64(file: File): Promise<string> {
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return Promise.reject(new AvatarTooLargeError("Image must be smaller than 5MB"));
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}