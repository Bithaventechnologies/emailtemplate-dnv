"use client";

import { useParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { SignatureForm } from "@/components/signatures/signature-form";
import { useSignature, useUpdateSignature } from "@/hooks/use-signatures";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import type { CreateSignatureInput } from "@email-platform/types";

export default function EditSignaturePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { data: signature, isLoading, isError } = useSignature(params.id);
  const updateSignature = useUpdateSignature(params.id);
  const { toast } = useToast();

  async function handleSubmit(values: CreateSignatureInput) {
    try {
      await updateSignature.mutateAsync(values);
      toast({ title: "Signature updated", variant: "success" });
      router.push("/signatures");
    } catch (error) {
      toast({ title: "Failed to update signature", description: getErrorMessage(error), variant: "error" });
    }
  }

  if (isLoading) return <Skeleton className="h-96 max-w-lg" />;
  if (isError || !signature) {
    return (
      <Card>
        <EmptyState title="Signature not found" />
      </Card>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Edit signature</h1>
      </div>
      <Card>
        <CardHeader title="Signature details" />
        <CardBody>
          <SignatureForm
            defaultValues={{
              name: signature.name,
              jobTitle: signature.jobTitle ?? undefined,
              department: signature.department ?? undefined,
              email: signature.email ?? undefined,
              phone: signature.phone ?? undefined,
              website: signature.website ?? undefined,
              address: signature.address ?? undefined,
              isDefault: signature.isDefault,
            }}
            onSubmit={handleSubmit}
            submitting={updateSignature.isPending}
            submitLabel="Save changes"
          />
        </CardBody>
      </Card>
    </div>
  );
}
