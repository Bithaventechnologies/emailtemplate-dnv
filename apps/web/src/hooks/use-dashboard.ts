"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";

export interface DashboardAnalytics {
  totals: {
    sent: number;
    delivered: number;
    failed: number;
    bounced: number;
    opened: number;
    clicked: number;
  };
  rates: {
    deliveryRate: number;
    failureRate: number;
    bounceRate: number;
    openRate: number;
    clickRate: number;
  };
  trends: Array<{ date: string; sent: number; delivered: number; failed: number }>;
  recentCampaigns: Array<{ id: string; name: string; status: string; totalRecipients: number; createdAt: string }>;
  recentFailures: Array<{ id: string; subject: string; failureReason: string | null; failedAt: string | null }>;
  mostUsedTemplates: Array<{ templateId: string; name: string; usageCount: number }>;
}

export function useDashboard(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard(dateFrom, dateTo),
    queryFn: () => apiClient.get<DashboardAnalytics>("/analytics/dashboard", { dateFrom, dateTo }),
  });
}
