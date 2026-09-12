"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthenticatedUser } from "@email-platform/types";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export function useAuth() {
  const query = useQuery({
    queryKey: queryKeys.me(),
    queryFn: () => apiClient.get<AuthenticatedUser>("/auth/me"),
    retry: false,
    staleTime: 60_000,
  });

  const isUnauthenticated = query.isError && query.error instanceof ApiClientError && query.error.status === 401;

  return {
    user: query.data,
    isLoading: query.isLoading,
    isAuthenticated: !!query.data,
    isUnauthenticated,
    refetch: query.refetch,
  };
}
