"use client";

import { useGetSellerDetailsQuery } from "../shopApiSlice";

export function useCurrentSeller() {
  const { data, isLoading, isFetching, error, refetch } = useGetSellerDetailsQuery();

  return {
    seller: data?.seller ?? null,
    isAuthenticated: Boolean(data?.seller),
    isLoading,
    isFetching,
    error,
    refetch,
  };
}