"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateSignatureInput, UpdateSignatureInput } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import type { FileAssetDto } from "./use-branding";

export interface EmailSignatureDto {
  id: string;
  organizationId: string;
  name: string;
  jobTitle: string | null;
  department: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  socialLinksJson: Record<string, string> | null;
  profileImageAssetId: string | null;
  profileImageAsset?: FileAssetDto | null;
  isDefault: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useSignatures() {
  return useQuery({
    queryKey: queryKeys.signatures(),
    queryFn: () => apiClient.get<EmailSignatureDto[]>("/signatures"),
  });
}

export function useSignature(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.signature(id ?? ""),
    queryFn: () => apiClient.get<EmailSignatureDto>(`/signatures/${id}`),
    enabled: !!id,
  });
}

export function useCreateSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSignatureInput) => apiClient.post<EmailSignatureDto>("/signatures", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatures"] }),
  });
}

export function useUpdateSignature(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSignatureInput) => apiClient.patch<EmailSignatureDto>(`/signatures/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatures"] }),
  });
}

export function useDeleteSignature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ deleted: true }>(`/signatures/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["signatures"] }),
  });
}

export function useUploadSignatureImage() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.upload<FileAssetDto>("/signatures/image", formData);
    },
  });
}
