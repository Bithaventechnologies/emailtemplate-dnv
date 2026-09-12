"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateBrandingSchema, type UpdateBrandingInput } from "@email-platform/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useBranding, useUpdateBranding, useUploadLogo } from "@/hooks/use-branding";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import { cn } from "@/lib/cn";

export default function BrandingPage() {
  const { data: branding, isLoading } = useBranding();
  const updateBranding = useUpdateBranding();
  const uploadLogo = useUploadLogo();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateBrandingInput>({ resolver: zodResolver(updateBrandingSchema) });

  useEffect(() => {
    if (branding) {
      reset({
        companyName: branding.companyName,
        websiteUrl: branding.websiteUrl ?? "",
        supportEmail: branding.supportEmail ?? "",
        phone: branding.phone ?? "",
        address: branding.address ?? "",
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        footerText: branding.footerText ?? "",
        socialLinks: (branding.socialLinksJson as UpdateBrandingInput["socialLinks"]) ?? {},
        logoAssetId: branding.logoAssetId,
      });
    }
  }, [branding, reset]);

  async function onSubmit(values: UpdateBrandingInput) {
    try {
      await updateBranding.mutateAsync(values);
      toast({ title: "Branding saved", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to save branding", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please upload an image file.", variant: "error" });
      return;
    }
    try {
      const asset = await uploadLogo.mutateAsync(file);
      toast({ title: "Logo uploaded", variant: "success" });
      await updateBranding.mutateAsync({
        companyName: branding?.companyName ?? "",
        primaryColor: branding?.primaryColor ?? "#111827",
        secondaryColor: branding?.secondaryColor ?? "#6366F1",
        logoAssetId: asset.id,
      });
    } catch (error) {
      toast({ title: "Logo upload failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Branding</h1>
        <p className="mt-1 text-sm text-ink-500">Configure your company profile, logo, and appearance for outgoing emails.</p>
      </div>

      <Card id="logo">
        <CardHeader title="Logo" description="Used in the header of every branded email." />
        <CardBody>
          <div className="flex items-center gap-6">
            {branding?.logoAsset?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={branding.logoAsset.url} alt="Company logo" className="h-16 w-16 rounded-lg border border-ink-100 object-contain" />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-ink-200 text-xs text-ink-400">
                No logo
              </div>
            )}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              className={cn(
                "focus-ring flex-1 cursor-pointer rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm transition-colors",
                dragOver ? "border-accent-400 bg-accent-50" : "border-ink-200 text-ink-500 hover:border-ink-300",
              )}
            >
              {uploadLogo.isPending ? "Uploading..." : "Drag and drop, or click to upload a logo"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card>
          <CardHeader title="Company profile" />
          <CardBody className="space-y-4">
            <div>
              <Label htmlFor="companyName" required>
                Company name
              </Label>
              <Input id="companyName" error={errors.companyName?.message} {...register("companyName")} />
              <FieldError message={errors.companyName?.message} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="websiteUrl">Website</Label>
                <Input id="websiteUrl" {...register("websiteUrl")} placeholder="https://" />
                <FieldError message={errors.websiteUrl?.message} />
              </div>
              <div>
                <Label htmlFor="supportEmail">Support email</Label>
                <Input id="supportEmail" {...register("supportEmail")} />
                <FieldError message={errors.supportEmail?.message} />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register("phone")} />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" {...register("address")} />
              </div>
            </div>
            <div>
              <Label htmlFor="footerText">Footer text</Label>
              <Textarea id="footerText" rows={2} {...register("footerText")} />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6" id="appearance">
          <CardHeader title="Appearance" description="Primary and secondary colors used across branded emails." />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="primaryColor" required>
                Primary color
              </Label>
              <div className="flex items-center gap-2">
                <Input id="primaryColor" type="color" className="h-9 w-14 p-1" {...register("primaryColor")} />
                <Input aria-label="Primary color hex" {...register("primaryColor")} />
              </div>
              <FieldError message={errors.primaryColor?.message} />
            </div>
            <div>
              <Label htmlFor="secondaryColor" required>
                Secondary color
              </Label>
              <div className="flex items-center gap-2">
                <Input id="secondaryColor" type="color" className="h-9 w-14 p-1" {...register("secondaryColor")} />
                <Input aria-label="Secondary color hex" {...register("secondaryColor")} />
              </div>
              <FieldError message={errors.secondaryColor?.message} />
            </div>
          </CardBody>
        </Card>

        <Card className="mt-6">
          <CardHeader title="Social links" />
          <CardBody className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="twitter">Twitter / X</Label>
              <Input id="twitter" {...register("socialLinks.twitter")} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input id="linkedin" {...register("socialLinks.linkedin")} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input id="facebook" {...register("socialLinks.facebook")} placeholder="https://" />
            </div>
            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input id="instagram" {...register("socialLinks.instagram")} placeholder="https://" />
            </div>
          </CardBody>
        </Card>

        <div className="mt-6">
          <Button type="submit" loading={updateBranding.isPending}>
            Save branding
          </Button>
        </div>
      </form>
    </div>
  );
}
