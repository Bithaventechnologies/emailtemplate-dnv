"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { useRecipient, useUpdateRecipient } from "@/hooks/use-recipients";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { CreateRecipientInput } from "@email-platform/types";

export default function EditRecipientPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: recipient, isLoading, isError } = useRecipient(params.id);
  const updateRecipient = useUpdateRecipient(params.id);
  const { toast } = useToast();

  async function handleSubmit(values: CreateRecipientInput) {
    try {
      await updateRecipient.mutateAsync(values);
      toast({ title: "Recipient updated", variant: "success" });
      router.push("/recipients");
    } catch (error) {
      toast({ title: "Failed to update recipient", description: getErrorMessage(error), variant: "error" });
    }
  }

  if (isLoading) return <Skeleton className="h-96 max-w-lg" />;
  if (isError || !recipient) {
    return (
      <Card>
        <EmptyState title="Recipient not found" />
      </Card>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Edit recipient</h1>
        <p className="mt-1 text-sm text-ink-500">{recipient.email}</p>
      </div>
      <Card>
        <CardHeader title="Recipient details" />
        <CardBody>
          <RecipientForm
            defaultValues={{
              email: recipient.email,
              firstName: recipient.firstName ?? undefined,
              lastName: recipient.lastName ?? undefined,
              company: recipient.company ?? undefined,
              phone: recipient.phone ?? undefined,
            }}
            onSubmit={handleSubmit}
            submitting={updateRecipient.isPending}
            submitLabel="Save changes"
          />
        </CardBody>
      </Card>
    </div>
  );
}
