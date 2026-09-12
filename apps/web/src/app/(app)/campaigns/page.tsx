"use client";

import { useState } from "react";
import Link from "next/link";
import { useCampaigns } from "@/hooks/use-campaigns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";

export default function CampaignsPage() {
  const [status, setStatus] = useState("");
  const { data: campaigns, isLoading } = useCampaigns(status || undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Campaigns</h1>
          <p className="mt-1 text-sm text-ink-500">Track sent and in-progress email campaigns.</p>
        </div>
        <Link href="/compose">
          <Button>Compose email</Button>
        </Link>
      </div>

      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-48">
        <option value="">All statuses</option>
        <option value="DRAFT">Draft</option>
        <option value="QUEUED">Queued</option>
        <option value="SENDING">Sending</option>
        <option value="COMPLETED">Completed</option>
        <option value="PARTIALLY_FAILED">Partially failed</option>
        <option value="FAILED">Failed</option>
        <option value="CANCELLED">Cancelled</option>
      </Select>

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !campaigns || campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            description="Compose your first branded email campaign."
            action={
              <Link href="/compose">
                <Button>Compose email</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Recipients</th>
                  <th className="px-5 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-ink-50">
                    <td className="px-5 py-3">
                      <Link href={`/campaigns/${c.id}`} className="focus-ring rounded font-medium text-ink-900 hover:text-accent-600">
                        {c.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-3 text-ink-600">{c.totalRecipients}</td>
                    <td className="px-5 py-3 text-ink-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
