"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useCampaignDetail, useCancelCampaign } from "@/hooks/use-campaigns";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
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
  const confirm = useConfirm();
  const { toast } = useToast();

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
        <div className="flex gap-2">
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
        <CardBody>
          <p className="text-sm text-ink-500">
            Detailed per-recipient delivery rows are available via the API and will render here once campaign sending
            data is populated for this campaign.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
