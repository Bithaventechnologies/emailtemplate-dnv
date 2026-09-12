"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpdateBrandingInput } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface FileAssetDto {
  id: string;
  organizationId: string;
  key: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  originalName: string;
  createdAt: string;
}

export interface EmailBrandingDto {
  id: string;
  organizationId: string;
  companyName: string;
  websiteUrl: string | null;
  supportEmail: string | null;
  phone: string | null;
  address: string | null;
  primaryColor: string;
  secondaryColor: string;
  footerText: string | null;
  socialLinksJson: Record<string, string> | null;
  logoAssetId: string | null;
  logoAsset?: FileAssetDto | null;
  updatedAt: string;
  createdAt: string;
}

export function useBranding() {
  return useQuery({
    queryKey: queryKeys.branding(),
    queryFn: () => apiClient.get<EmailBrandingDto>("/branding"),
  });
}

export function useUpdateBranding() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateBrandingInput) => apiClient.post<EmailBrandingDto>("/branding", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branding() }),
  });
}

export function useUploadLogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiClient.upload<FileAssetDto>("/branding/logo", formData);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.branding() }),
  });
}
