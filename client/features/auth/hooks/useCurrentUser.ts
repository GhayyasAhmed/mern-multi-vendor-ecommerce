"use client";

import { useGetUserDetailsQuery } from "../authApiSlice";

/**
 * Single source of truth for "is someone logged in right now" on the client.
 * Cookies are httpOnly, so the only reliable way to know session state
 * client-side is to ask the backend (which reads accessToken/refreshToken).
 */
export function useCurrentUser() {
  const { data, isLoading, isFetching, error, refetch } = useGetUserDetailsQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  return {
    user: data?.user ?? null,
    isAuthenticated: Boolean(data?.user),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}