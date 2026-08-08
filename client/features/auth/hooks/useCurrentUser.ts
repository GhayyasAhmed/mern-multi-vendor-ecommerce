"use client";

import { useGetUserDetailsQuery } from "../authApiSlice";

interface UseCurrentUserOptions {
  skip?: boolean;
}

export function useCurrentUser(options?: UseCurrentUserOptions) {
  const { data, isLoading, isFetching, error, refetch } = useGetUserDetailsQuery(undefined, {
    skip: options?.skip,
  });

  return {
    user: data?.user ?? null,
    isAuthenticated: Boolean(data?.user),
    isLoading: options?.skip ? false : isLoading,
    isFetching,
    error,
    refetch,
  };
}