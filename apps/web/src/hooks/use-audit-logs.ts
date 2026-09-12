"use client";

import { useQuery } from "@tanstack/react-query";
import type { PaginatedResult } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface AuditLogDto {
  id: string;
  organizationId: string | null;
  actorId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  ipAddress: string | null;
  metadataJson: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: unknown;
}

export function useAuditLogs(params: AuditLogsQueryParams) {
  return useQuery({
    queryKey: queryKeys.auditLogs(params),
    queryFn: () =>
      apiClient.get<PaginatedResult<AuditLogDto>>("/audit-logs", {
        page: params.page,
        limit: params.limit,
        search: params.search,
      }),
  });
}
