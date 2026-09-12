"use client";

import { useState } from "react";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useAuditLogs({ page, limit: 20, search: search || undefined });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Audit logs</h1>
        <p className="mt-1 text-sm text-ink-500">A record of actions taken across your organization.</p>
      </div>

      <Input
        placeholder="Search by action or resource type..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        className="max-w-xs"
      />

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No audit log entries" description="Actions taken in the app will be recorded here." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Resource</th>
                    <th className="px-5 py-3">IP Address</th>
                    <th className="px-5 py-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.items.map((log) => (
                    <tr key={log.id} className="hover:bg-ink-50">
                      <td className="px-5 py-3 font-medium text-ink-900">{log.action}</td>
                      <td className="px-5 py-3 text-ink-600">
                        {log.resourceType}
                        {log.resourceId ? <span className="text-ink-400"> #{log.resourceId.slice(-6)}</span> : null}
                      </td>
                      <td className="px-5 py-3 text-ink-500">{log.ipAddress ?? "—"}</td>
                      <td className="px-5 py-3 text-ink-500">{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
