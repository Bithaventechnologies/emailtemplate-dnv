"use client";

import Link from "next/link";
import { useDashboard } from "@/hooks/use-dashboard";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { StatCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-500">Overview of email delivery performance.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : isError || !data ? (
        <Card>
          <EmptyState title="Couldn't load analytics" description="The API may be unavailable. Try again shortly." />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Sent" value={data.totals.sent.toLocaleString()} />
            <StatCard label="Delivered" value={data.totals.delivered.toLocaleString()} trend={{ direction: "flat", label: formatPercent(data.rates.deliveryRate) }} />
            <StatCard label="Failed" value={data.totals.failed.toLocaleString()} tone="danger" trend={{ direction: "flat", label: formatPercent(data.rates.failureRate) }} />
            <StatCard label="Bounced" value={data.totals.bounced.toLocaleString()} tone="danger" trend={{ direction: "flat", label: formatPercent(data.rates.bounceRate) }} />
            <StatCard label="Open Rate" value={formatPercent(data.rates.openRate)} />
            <StatCard label="Click Rate" value={formatPercent(data.rates.clickRate)} />
          </div>

          <Card>
            <CardHeader title="Delivery trends" description="Sent, delivered, and failed over the last 30 days" />
            <CardBody>
              {data.trends.length === 0 ? (
                <EmptyState
                  title="No email activity yet"
                  description="Once you send your first campaign, trends will appear here."
                />
              ) : (
                <TrendChart data={data.trends} />
              )}
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader title="Recent campaigns" action={<Link href="/campaigns" className="focus-ring rounded text-xs font-medium text-accent-600 hover:text-accent-700">View all</Link>} />
              {data.recentCampaigns.length === 0 ? (
                <EmptyState
                  title="No campaigns yet"
                  description="Create your first campaign to start sending branded emails."
                  action={
                    <Link href="/compose">
                      <Button size="sm">Compose email</Button>
                    </Link>
                  }
                />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {data.recentCampaigns.map((c) => (
                    <li key={c.id}>
                      <Link href={`/campaigns/${c.id}`} className="focus-ring flex items-center justify-between px-5 py-3 hover:bg-ink-50">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-800">{c.name}</p>
                          <p className="text-xs text-ink-500">{c.totalRecipients} recipients</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHeader title="Recent failures" action={<Link href="/failed-emails" className="focus-ring rounded text-xs font-medium text-accent-600 hover:text-accent-700">View all</Link>} />
              {data.recentFailures.length === 0 ? (
                <EmptyState title="No failures" description="Failed sends will show up here for quick triage." />
              ) : (
                <ul className="divide-y divide-ink-100">
                  {data.recentFailures.map((f) => (
                    <li key={f.id} className="px-5 py-3">
                      <p className="truncate text-sm font-medium text-ink-800">{f.subject}</p>
                      <p className="truncate text-xs text-red-600">{f.failureReason ?? "Unknown error"}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <CardHeader title="Most used templates" />
            {data.mostUsedTemplates.length === 0 ? (
              <EmptyState title="No usage yet" description="Template usage stats will appear once campaigns are sent." />
            ) : (
              <ul className="divide-y divide-ink-100">
                {data.mostUsedTemplates.map((t) => (
                  <li key={t.templateId} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm font-medium text-ink-800">{t.name}</span>
                    <span className="text-xs text-ink-500">{t.usageCount} campaigns</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
