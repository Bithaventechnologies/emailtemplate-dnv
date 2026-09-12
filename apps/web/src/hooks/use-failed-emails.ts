"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PaginatedResult } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface FailedEmailDto {
  id: string;
  organizationId: string;
  campaignId: string | null;
  recipientId: string;
  fromEmail: string;
  fromName: string;
  subject: string;
  status: string;
  failureReason: string | null;
  failureType: "TRANSIENT" | "PERMANENT" | "UNKNOWN" | null;
  retryCount: number;
  failedAt: string | null;
  createdAt: string;
}

export interface FailedEmailsQueryParams {
  page?: number;
  limit?: number;
  failureType?: string;
  campaignId?: string;
  [key: string]: unknown;
}

export function useFailedEmails(params: FailedEmailsQueryParams) {
  return useQuery({
    queryKey: queryKeys.failedEmails(params),
    queryFn: () =>
      apiClient.get<PaginatedResult<FailedEmailDto>>("/failed-emails", {
        page: params.page,
        limit: params.limit,
        failureType: params.failureType,
        campaignId: params.campaignId,
      }),
  });
}

export function useRetryFailedEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.post(`/failed-emails/${id}/retry`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["failed-emails"] }),
  });
}
