"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDeleteSignature, useSignatures, useUpdateSignature } from "@/hooks/use-signatures";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu, DotsIcon } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import type { EmailSignatureDto } from "@/hooks/use-signatures";

export default function SignaturesPage() {
  const router = useRouter();
  const { data: signatures, isLoading } = useSignatures();
  const deleteSignature = useDeleteSignature();
  const confirm = useConfirm();
  const { toast } = useToast();

  async function handleDelete(sig: EmailSignatureDto) {
    const ok = await confirm({
      title: `Delete "${sig.name}"?`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteSignature.mutateAsync(sig.id);
      toast({ title: "Signature deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to delete signature", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Signatures</h1>
          <p className="mt-1 text-sm text-ink-500">Manage email signatures used in campaigns.</p>
        </div>
        <Link href="/signatures/new">
          <Button>New signature</Button>
        </Link>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton rows={3} cols={3} />
        ) : !signatures || signatures.length === 0 ? (
          <EmptyState
            title="No signatures yet"
            description="Create a signature to attach to campaigns and templates."
            action={
              <Link href="/signatures/new">
                <Button>New signature</Button>
              </Link>
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {signatures.map((sig) => (
              <SignatureRow key={sig.id} signature={sig} onDelete={() => handleDelete(sig)} onEdit={() => router.push(`/signatures/${sig.id}`)} />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SignatureRow({
  signature,
  onDelete,
  onEdit,
}: {
  signature: EmailSignatureDto;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const updateSignature = useUpdateSignature(signature.id);
  const { toast } = useToast();

  async function handleSetDefault() {
    try {
      await updateSignature.mutateAsync({ isDefault: true });
      toast({ title: "Default signature updated", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to update default", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <li className="flex items-center justify-between px-5 py-3">
      <div>
        <p className="text-sm font-medium text-ink-900">{signature.name}</p>
        <p className="text-xs text-ink-500">{signature.jobTitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {signature.isDefault ? <Badge tone="success">Default</Badge> : null}
        <Menu
          trigger={<DotsIcon />}
          items={[
            { label: "Edit", onClick: onEdit },
            { label: "Set as default", onClick: handleSetDefault, disabled: signature.isDefault },
            { label: "Delete", onClick: onDelete, danger: true },
          ]}
        />
      </div>
    </li>
  );
}
