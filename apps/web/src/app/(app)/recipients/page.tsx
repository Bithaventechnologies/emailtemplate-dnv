"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteRecipient, useRecipients, downloadRecipientsExport, type RecipientDto } from "@/hooks/use-recipients";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Menu, DotsIcon } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";

export default function RecipientsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const { data, isLoading } = useRecipients({ page, limit: 20, search: search || undefined, status: status || undefined });
  const deleteRecipient = useDeleteRecipient();
  const confirm = useConfirm();
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleDelete(recipient: RecipientDto) {
    const ok = await confirm({
      title: `Delete ${recipient.email}?`,
      description: "This recipient will be removed from all lists and future sends.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteRecipient.mutateAsync(recipient.id);
      toast({ title: "Recipient deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to delete recipient", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleExport() {
    setExporting(true);
    try {
      await downloadRecipientsExport();
    } catch (error) {
      toast({ title: "Export failed", description: getErrorMessage(error), variant: "error" });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Recipients</h1>
          <p className="mt-1 text-sm text-ink-500">Manage individual recipients across your organization.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleExport} loading={exporting}>
            Export CSV
          </Button>
          <Link href="/recipients/import">
            <Button variant="outline">Import CSV</Button>
          </Link>
          <Link href="/recipients/new">
            <Button>Add recipient</Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="w-44"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INVALID">Invalid</option>
          <option value="BOUNCED">Bounced</option>
          <option value="UNSUBSCRIBED">Unsubscribed</option>
          <option value="SUPPRESSED">Suppressed</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            title="No recipients found"
            description={search || status ? "Try adjusting your filters." : "Import a CSV or add recipients manually to get started."}
            action={
              !search && !status ? (
                <Link href="/recipients/import">
                  <Button>Import CSV</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                    <th className="px-5 py-3">Email</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {data.items.map((r) => (
                    <tr key={r.id} className="hover:bg-ink-50">
                      <td className="px-5 py-3">
                        <Link href={`/recipients/${r.id}`} className="focus-ring rounded font-medium text-ink-900 hover:text-accent-600">
                          {r.email}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-ink-600">
                        {[r.firstName, r.lastName].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-5 py-3 text-ink-600">{r.company ?? "—"}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Menu
                          trigger={<DotsIcon />}
                          items={[
                            { label: "Edit", onClick: () => router.push(`/recipients/${r.id}`) },
                            { label: "Delete", onClick: () => handleDelete(r), danger: true },
                          ]}
                        />
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
