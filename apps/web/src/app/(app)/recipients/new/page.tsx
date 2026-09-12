"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { RecipientForm } from "@/components/recipients/recipient-form";
import { useCreateRecipient } from "@/hooks/use-recipients";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import type { CreateRecipientInput } from "@email-platform/types";

export default function NewRecipientPage() {
  const router = useRouter();
  const createRecipient = useCreateRecipient();
  const { toast } = useToast();

  async function handleSubmit(values: CreateRecipientInput) {
    try {
      await createRecipient.mutateAsync(values);
      toast({ title: "Recipient added", variant: "success" });
      router.push("/recipients");
    } catch (error) {
      toast({ title: "Failed to add recipient", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Add recipient</h1>
        <p className="mt-1 text-sm text-ink-500">Add a single recipient to your organization.</p>
      </div>
      <Card>
        <CardHeader title="Recipient details" />
        <CardBody>
          <RecipientForm onSubmit={handleSubmit} submitting={createRecipient.isPending} submitLabel="Add recipient" />
        </CardBody>
      </Card>
    </div>
  );
}
