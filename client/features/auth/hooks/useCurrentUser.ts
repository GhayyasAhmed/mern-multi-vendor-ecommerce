"use client";

import { useGetUserDetailsQuery } from "../authApiSlice";

/**
 * Single source of truth for "is someone logged in right now" on the client.
 * Cookies are httpOnly, so the only reliable way to know session state
 * client-side is to ask the backend (which reads accessToken/refreshToken).
*
 * Deliberately no `refetchOnFocus`: with a single always-mounted subscriber
 * (AuthProvider), refetching on every window-focus event fires on unrelated
 * UI interactions (tab switches, devtools, alt-tab). A stale access token
 * is already handled reactively by apiSlice's refresh-on-401 logic the
 * next time a protected request is actually made.
  */
export function useCurrentUser() {
  const { data, isLoading, isFetching, error, refetch } = useGetUserDetailsQuery(undefined, {
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