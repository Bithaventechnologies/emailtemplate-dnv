"use client";

import { useDashboard } from "@/hooks/use-dashboard";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { StatCardSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";

export default function TrackingPage() {
  const { data, isLoading } = useDashboard();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Tracking</h1>
        <p className="mt-1 text-sm text-ink-500">Delivery, open, and click tracking across all campaigns.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : !data ? (
        <Card>
          <EmptyState title="No tracking data available" />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Opened" value={data.totals.opened.toLocaleString()} />
            <StatCard label="Clicked" value={data.totals.clicked.toLocaleString()} />
            <StatCard label="Open Rate" value={`${(data.rates.openRate * 100).toFixed(1)}%`} />
            <StatCard label="Click Rate" value={`${(data.rates.clickRate * 100).toFixed(1)}%`} />
          </div>
          <Card>
            <CardHeader title="Activity over time" />
            <CardBody>
              {data.trends.length === 0 ? (
                <EmptyState title="No activity yet" />
              ) : (
                <TrendChart data={data.trends} />
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
