"use client";

import { useAppSelector } from "@/store/hooks";
import { selectSessionInvalid } from "../sessionSlice";
import { useGetUserDetailsQuery } from "../authApiSlice";

interface UseCurrentUserOptions {
  skip?: boolean;
}

export function useCurrentUser(options?: UseCurrentUserOptions) {
  // Once a refresh-token attempt has definitively confirmed there is no
  // valid session (see apiSlice.ts's circuit breaker), stop creating new
  // /getuser subscriptions altogether. Without this, every component that
  // mounts useCurrentUser (e.g. after client-side navigation) re-triggers
  // a getUserDetails query even though we already know it will 401.
  // The flag flips back to false after a successful login/activation, so
  // authenticated sessions still fetch/refetch exactly as before.
  const sessionInvalid = useAppSelector(selectSessionInvalid);
  const skip = Boolean(options?.skip) || sessionInvalid;

  const { data, isLoading, isFetching, error, refetch } = useGetUserDetailsQuery(undefined, {
    skip,
  });

  // A confirmed-invalid session (explicit logout, or a failed token
  // refresh) means there is no user, full stop — even if getUserDetails
  // still holds a "fulfilled" cache entry from a previous session. We
  // deliberately don't force a refetch to clear that entry (that would
  // mean an extra /getuser request); overriding here keeps the UI correct
  // (e.g. the header won't flash the previous user) without any network
  // cost.
  if (sessionInvalid) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isFetching: false,
      error,
      refetch,
    };
  }

  return {
    user: data?.user ?? null,
    isAuthenticated: Boolean(data?.user),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}