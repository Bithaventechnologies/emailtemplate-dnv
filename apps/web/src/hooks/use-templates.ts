"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTemplateInput, EmailDocument, UpdateTemplateInput } from "@email-platform/types";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface TemplateVariableDto {
  id: string;
  templateId: string;
  key: string;
  label: string;
  isRequired: boolean;
  defaultValue: string | null;
  source: "RECIPIENT" | "SYSTEM" | "BRANDING" | "CUSTOM";
  createdAt: string;
}

export interface TemplateVersionDto {
  id: string;
  templateId: string;
  versionNumber: number;
  subject: string;
  previewText: string | null;
  bodyBlocksJson: EmailDocument;
  bodyHtml: string;
  bodyText: string;
  createdAt: string;
}

export interface EmailTemplateDto {
  id: string;
  organizationId: string;
  categoryId: string;
  name: string;
  classification: "TRANSACTIONAL" | "MARKETING";
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  createdById: string;
  currentVersionId: string | null;
  currentVersion?: TemplateVersionDto | null;
  variables?: TemplateVariableDto[];
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PreviewResult {
  subject: string;
  html: string;
  text: string;
  unresolvedVariables: string[];
  mjmlErrors: string[];
}

export function useTemplates(categoryId?: string, status?: string) {
  return useQuery({
    queryKey: queryKeys.templates(categoryId, status),
    queryFn: () => apiClient.get<EmailTemplateDto[]>("/templates", { categoryId, status }),
  });
}

export function useTemplate(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.template(id ?? ""),
    queryFn: () => apiClient.get<EmailTemplateDto>(`/templates/${id}`),
    enabled: !!id,
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTemplateInput) => apiClient.post<EmailTemplateDto>("/templates", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function useUpdateTemplate(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTemplateInput) => apiClient.patch<EmailTemplateDto>(`/templates/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["templates"] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete<{ deleted: true }>(`/templates/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["templates"] }),
  });
}

export function usePreviewTemplate(id: string) {
  return useMutation({
    mutationFn: (sampleVariables: Record<string, string>) =>
      apiClient.post<PreviewResult>(`/templates/${id}/preview`, { sampleVariables }),
  });
}

export function useSendTestEmail(id: string) {
  return useMutation({
    mutationFn: (input: { toEmail: string; sampleVariables: Record<string, string> }) =>
      apiClient.post(`/templates/${id}/send-test`, input),
  });
}

export function useExtractVariables() {
  return useMutation({
    mutationFn: (input: { body: EmailDocument; subject: string; previewText?: string }) =>
      apiClient.post<{ variables: string[] }>("/templates/extract-variables", input),
  });
}
