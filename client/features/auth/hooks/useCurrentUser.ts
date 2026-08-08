"use client";

import { useGetUserDetailsQuery } from "../authApiSlice";

export function useCurrentUser() {
  const { data, isLoading, isFetching, error, refetch } = useGetUserDetailsQuery(undefined, 
    // {
    // refetchOnReconnect: true,
  // }
);

  return {
    user: data?.user ?? null,
    isAuthenticated: Boolean(data?.user),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}