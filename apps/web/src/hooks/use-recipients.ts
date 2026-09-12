"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateRecipientInput,
  CreateRecipientListInput,
  CsvImportSummary,
  ImportRecipientsInput,
  UpdateRecipientInput,
} from "@email-platform/types";
import type { PaginatedResult } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface RecipientDto {
  id: string;
  organizationId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  phone: string | null;
  customFields: Record<string, string> | null;
  status: "ACTIVE" | "INVALID" | "BOUNCED" | "UNSUBSCRIBED" | "SUPPRESSED";
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientListDto {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RecipientsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  [key: string]: unknown;
}

export function useRecipients(params: RecipientsQueryParams) {
  return useQuery({
    queryKey: queryKeys.recipients(params),
    queryFn: () =>
      apiClient.get<PaginatedResult<RecipientDto>>("/recipients", {
        page: params.page,
        limit: params.limit,
        search: params.search,
        status: params.status,
      }),
  });
}

export function useRecipient(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recipient(id ?? ""),
    queryFn: () => apiClient.get<RecipientDto>(`/recipients/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecipientInput) => apiClient.post<RecipientDto>("/recipients", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipients"] }),
  });
}

export function useUpdateRecipient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateRecipientInput) => apiClient.patch<RecipientDto>(`/recipients/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipients"] }),
  });
}

export function useDeleteRecipient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ deleted: true }>(`/recipients/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipients"] }),
  });
}

export function useRecipientLists() {
  return useQuery({
    queryKey: queryKeys.recipientLists(),
    queryFn: () => apiClient.get<RecipientListDto[]>("/recipients/lists/all"),
  });
}

export function useRecipientList(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recipientList(id ?? ""),
    queryFn: () => apiClient.get<RecipientListDto>(`/recipients/lists/${id}`),
    enabled: !!id,
  });
}

export function useCreateRecipientList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRecipientListInput) => apiClient.post<RecipientListDto>("/recipients/lists", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipients", "lists"] }),
  });
}

export function useDeleteRecipientList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ deleted: true }>(`/recipients/lists/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipients", "lists"] }),
  });
}

export function useAddListMembers(listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipientIds: string[]) => apiClient.post(`/recipients/lists/${listId}/members`, { recipientIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["recipients"] }),
  });
}

export function useImportPreview() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.upload<{ fileAssetId: string } & CsvImportSummary>("/recipients/import/preview", formData);
    },
  });
}

export function useConfirmImport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ImportRecipientsInput) =>
      apiClient.post<{ imported: number; skipped: number; listId?: string }>("/recipients/import/confirm", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients"] });
    },
  });
}

export async function downloadRecipientsExport(): Promise<void> {
  const blob = await apiClient.downloadBlob("/recipients/export");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "recipients-export.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
