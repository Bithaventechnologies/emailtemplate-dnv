"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getBulkSendConfirmationTier } from "@email-platform/types";
import { useCampaignDetail, useCancelCampaign, useSendCampaign, generateIdempotencyKey } from "@/hooks/use-campaigns";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";

const CANCELLABLE_STATUSES = new Set(["DRAFT", "SCHEDULED", "QUEUED"]);

export default function CampaignDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [recipientStatus, setRecipientStatus] = useState("");
  const { data, isLoading, isError } = useCampaignDetail(params.id, recipientStatus || undefined);
  const cancelCampaign = useCancelCampaign(params.id);
  const sendCampaign = useSendCampaign(params.id);
  const confirm = useConfirm();
  const { toast } = useToast();
  const [idempotencyKey] = useState(() => generateIdempotencyKey());
  const [typedCountConfirmation, setTypedCountConfirmation] = useState("");

  async function handleCancel() {
    const ok = await confirm({
      title: "Cancel this campaign?",
      description: "Any emails not yet sent will be stopped. This cannot be undone.",
      confirmLabel: "Cancel campaign",
      destructive: true,
    });
    if (!ok) return;
    try {
      await cancelCampaign.mutateAsync();
      toast({ title: "Campaign cancelled", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to cancel campaign", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleSend(totalRecipients: number) {
    const tier = getBulkSendConfirmationTier(totalRecipients);

    if (tier === "explicit") {
      if (typedCountConfirmation.trim() !== String(totalRecipients)) {
        toast({ title: "Type the exact recipient count to confirm", variant: "error" });
        return;
      }
    } else {
      const ok = await confirm({
        title: `Send to ${totalRecipients} recipient${totalRecipients === 1 ? "" : "s"}?`,
        description:
          tier === "enhanced"
            ? "This is a larger send. Double-check your template and recipient list before continuing."
            : "This will queue emails for immediate sending.",
        confirmLabel: "Send campaign",
        destructive: tier === "enhanced",
      });
      if (!ok) return;
    }

    try {
      await sendCampaign.mutateAsync({ idempotencyKey, confirmedRecipientCount: totalRecipients });
      toast({ title: "Campaign is sending", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to send campaign", description: getErrorMessage(error), variant: "error" });
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <EmptyState title="Campaign not found" />
      </Card>
    );
  }

  const { campaign, statusCounts, eventCounts } = data;
  const sendTier = getBulkSendConfirmationTier(campaign.totalRecipients);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">{campaign.name}</h1>
          <div className="mt-2 flex items-center gap-2">
            <StatusBadge status={campaign.status} />
            <span className="text-sm text-ink-500">{campaign.totalRecipients} recipients</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status === "DRAFT" && sendTier === "explicit" ? (
            <Input
              aria-label={`Type ${campaign.totalRecipients} to confirm`}
              placeholder={`Type "${campaign.totalRecipients}" to confirm`}
              value={typedCountConfirmation}
              onChange={(e) => setTypedCountConfirmation(e.target.value)}
              className="w-48"
            />
          ) : null}
          {campaign.status === "DRAFT" ? (
            <Button
              onClick={() => handleSend(campaign.totalRecipients)}
              loading={sendCampaign.isPending}
              disabled={sendTier === "explicit" && typedCountConfirmation.trim() !== String(campaign.totalRecipients)}
            >
              Send campaign
            </Button>
          ) : null}
          <Button variant="outline" onClick={() => router.push("/campaigns")}>
            Back to campaigns
          </Button>
          {CANCELLABLE_STATUSES.has(campaign.status) ? (
            <Button variant="danger" onClick={handleCancel} loading={cancelCampaign.isPending}>
              Cancel campaign
            </Button>
          ) : null}
        </div>
      </div>

      {statusCounts ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="rounded-xl border border-ink-100 bg-white p-4 shadow-card">
              <p className="text-xs font-medium uppercase text-ink-400">{status.toLowerCase()}</p>
              <p className="mt-1 text-xl font-semibold text-ink-900">{count}</p>
            </div>
          ))}
        </div>
      ) : null}

      {eventCounts && Object.keys(eventCounts).length > 0 ? (
        <Card>
          <CardHeader title="Engagement events" />
          <CardBody className="flex flex-wrap gap-4">
            {Object.entries(eventCounts).map(([type, count]) => (
              <div key={type} className="text-sm">
                <span className="font-medium text-ink-900">{count}</span>{" "}
                <span className="text-ink-500">{type.toLowerCase()}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader
          title="Recipients"
          action={
            <Select value={recipientStatus} onChange={(e) => setRecipientStatus(e.target.value)} className="w-40">
              <option value="">All statuses</option>
              <option value="DELIVERED">Delivered</option>
              <option value="FAILED">Failed</option>
              <option value="BOUNCED">Bounced</option>
              <option value="OPENED">Opened</option>
              <option value="CLICKED">Clicked</option>
            </Select>
          }
        />
        <CardBody className="p-0">
          {data.recipients.length === 0 ? (
            <p className="p-6 text-sm text-ink-500">No recipients match this filter.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-medium uppercase text-ink-400">
                  <th className="px-4 py-2">Email</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Sent</th>
                  <th className="px-4 py-2">Opens</th>
                  <th className="px-4 py-2">Clicks</th>
                  <th className="px-4 py-2">Failure reason</th>
                </tr>
              </thead>
              <tbody>
                {data.recipients.map((r) => (
                  <tr key={r.id} className="border-b border-ink-50 last:border-0">
                    <td className="px-4 py-2 text-ink-900">{r.email}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-2 text-ink-500">{r.sentAt ? new Date(r.sentAt).toLocaleString() : "—"}</td>
                    <td className="px-4 py-2 text-ink-500">{r.openCount}</td>
                    <td className="px-4 py-2 text-ink-500">{r.clickCount}</td>
                    <td className="px-4 py-2 text-ink-500">{r.failureReason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
