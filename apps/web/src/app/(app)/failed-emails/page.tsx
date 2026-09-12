"use client";

import { useState } from "react";
import { useFailedEmails, useRetryFailedEmail } from "@/hooks/use-failed-emails";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";

export default function FailedEmailsPage() {
  const [page, setPage] = useState(1);
  const [failureType, setFailureType] = useState("");
  const { data, isLoading } = useFailedEmails({ page, limit: 20, failureType: failureType || undefined });
  const retry = useRetryFailedEmail();
  const confirm = useConfirm();
  const { toast } = useToast();

  async function handleRetry(id: string, subject: string) {
    const ok = await confirm({
      title: `Retry sending "${subject}"?`,
      description: "This will attempt to resend the email to the original recipient.",
      confirmLabel: "Retry",
    });
    if (!ok) return;
    try {
      await retry.mutateAsync(id);
      toast({ title: "Retry queued", variant: "success" });
    } catch (error) {
      toast({ title: "Retry failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Failed emails</h1>
        <p className="mt-1 text-sm text-ink-500">Review and retry emails that failed to send.</p>
      </div>

      <Select
        value={failureType}
        onChange={(e) => {
          setFailureType(e.target.value);
          setPage(1);
        }}
        className="w-48"
      >
        <option value="">All failure types</option>
        <option value="TRANSIENT">Transient</option>
        <option value="PERMANENT">Permanent</option>
        <option value="UNKNOWN">Unknown</option>
      </Select>

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState title="No failed emails" description="Failed sends will appear here for review and retry." />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3">Subject</th>
                    <th className="px-5 py-3">Failure reason</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Retries</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.items.map((email) => (
                    <tr key={email.id} className="hover:bg-ink-50">
                      <td className="px-5 py-3 font-medium text-ink-900">{email.subject}</td>
                      <td className="max-w-xs truncate px-5 py-3 text-red-600">{email.failureReason ?? "Unknown"}</td>
                      <td className="px-5 py-3">
                        {email.failureType ? <Badge tone="warning">{email.failureType.toLowerCase()}</Badge> : "—"}
                      </td>
                      <td className="px-5 py-3 text-ink-500">{email.retryCount}</td>
                      <td className="px-5 py-3 text-right">
                        <Button size="sm" variant="outline" onClick={() => handleRetry(email.id, email.subject)} loading={retry.isPending}>
                          Retry
                        </Button>
                      </td>
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
