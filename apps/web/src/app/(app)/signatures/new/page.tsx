"use client";

import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SignatureForm } from "@/components/signatures/signature-form";
import { useCreateSignature } from "@/hooks/use-signatures";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import type { CreateSignatureInput } from "@email-platform/types";

export default function NewSignaturePage() {
  const router = useRouter();
  const createSignature = useCreateSignature();
  const { toast } = useToast();

  async function handleSubmit(values: CreateSignatureInput) {
    try {
      await createSignature.mutateAsync(values);
      toast({ title: "Signature created", variant: "success" });
      router.push("/signatures");
    } catch (error) {
      toast({ title: "Failed to create signature", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">New signature</h1>
      </div>
      <Card>
        <CardHeader title="Signature details" />
        <CardBody>
          <SignatureForm onSubmit={handleSubmit} submitting={createSignature.isPending} submitLabel="Create signature" />
        </CardBody>
      </Card>
    </div>
  );
}
