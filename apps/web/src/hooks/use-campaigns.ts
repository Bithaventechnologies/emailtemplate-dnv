"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateCampaignInput, SendCampaignInput } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface CampaignDto {
  id: string;
  organizationId: string;
  name: string;
  templateId: string;
  templateVersionId: string;
  recipientListId: string | null;
  status: "DRAFT" | "SCHEDULED" | "QUEUED" | "SENDING" | "COMPLETED" | "PARTIALLY_FAILED" | "FAILED" | "CANCELLED";
  idempotencyKey: string | null;
  totalRecipients: number;
  createdById: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
}

export interface CampaignRecipientRow {
  id: string;
  recipientId: string;
  email: string;
  status: string;
  failureReason: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  openCount: number;
  clickCount: number;
}

export interface CampaignDetail {
  campaign: CampaignDto;
  statusCounts?: Record<string, number>;
  eventCounts?: Record<string, number>;
}

export function useCampaigns(status?: string) {
  return useQuery({
    queryKey: queryKeys.campaigns(status),
    queryFn: () => apiClient.get<CampaignDto[]>("/campaigns", { status }),
  });
}

export function useCampaignDetail(id: string | undefined, recipientStatus?: string) {
  return useQuery({
    queryKey: queryKeys.campaign(id ?? "", recipientStatus),
    queryFn: () => apiClient.get<CampaignDetail>(`/campaigns/${id}`, { recipientStatus }),
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCampaignInput) => apiClient.post<CampaignDto>("/campaigns", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useSendCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SendCampaignInput) => apiClient.post<CampaignDto>(`/campaigns/${id}/send`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useCancelCampaign(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post<CampaignDto>(`/campaigns/${id}/cancel`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
