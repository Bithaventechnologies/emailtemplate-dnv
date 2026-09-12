"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { useBranding } from "@/hooks/use-branding";
import { useSignatures } from "@/hooks/use-signatures";
import { Skeleton } from "@/components/ui/skeleton";

interface EmailDefaultsForm {
  senderName: string;
  replyTo: string;
  defaultSignatureId: string;
}

export default function EmailSettingsPage() {
  const { data: branding, isLoading: brandingLoading } = useBranding();
  const { data: signatures, isLoading: signaturesLoading } = useSignatures();
  const { register, reset } = useForm<EmailDefaultsForm>();

  useEffect(() => {
    if (branding) {
      reset({
        senderName: branding.companyName,
        replyTo: branding.supportEmail ?? "",
        defaultSignatureId: signatures?.find((s) => s.isDefault)?.id ?? "",
      });
    }
  }, [branding, signatures, reset]);

  const isLoading = brandingLoading || signaturesLoading;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Email settings</h1>
        <p className="mt-1 text-sm text-ink-500">Defaults applied to outgoing branded email.</p>
      </div>

      <Card>
        <CardHeader title="Sender defaults" description="Configured from your branding and signature settings." />
        <CardBody className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <>
              <div>
                <Label htmlFor="senderName">Sender name</Label>
                <Input id="senderName" disabled {...register("senderName")} />
                <p className="mt-1 text-xs text-ink-400">Derived from your company name in Branding.</p>
              </div>
              <div>
                <Label htmlFor="replyTo">Reply-to</Label>
                <Input id="replyTo" disabled {...register("replyTo")} />
                <p className="mt-1 text-xs text-ink-400">Derived from your support email in Branding.</p>
              </div>
              <div>
                <Label htmlFor="defaultSignatureId">Default signature</Label>
                <Select id="defaultSignatureId" disabled {...register("defaultSignatureId")}>
                  <option value="">None set</option>
                  {signatures?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex gap-2 pt-2">
                <a href="/branding">
                  <Button variant="outline" size="sm">
                    Edit branding
                  </Button>
                </a>
                <a href="/signatures">
                  <Button variant="outline" size="sm">
                    Manage signatures
                  </Button>
                </a>
              </div>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
