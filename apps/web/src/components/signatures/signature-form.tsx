"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSignatureSchema, type CreateSignatureInput } from "@email-platform/types";
import { Input, Textarea, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SignatureForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Save signature",
}: {
  defaultValues?: Partial<CreateSignatureInput>;
  onSubmit: (values: CreateSignatureInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateSignatureInput>({
    resolver: zodResolver(createSignatureSchema),
    defaultValues: { isDefault: false, ...defaultValues },
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Label htmlFor="name" required>
          Signature name
        </Label>
        <Input id="name" error={errors.name?.message} {...register("name")} />
        <FieldError message={errors.name?.message} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="jobTitle">Job title</Label>
          <Input id="jobTitle" {...register("jobTitle")} />
        </div>
        <div>
          <Label htmlFor="department">Department</Label>
          <Input id="department" {...register("department")} />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" {...register("email")} />
          <FieldError message={errors.email?.message} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
        <div>
          <Label htmlFor="website">Website</Label>
          <Input id="website" {...register("website")} placeholder="https://" />
          <FieldError message={errors.website?.message} />
        </div>
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" rows={2} {...register("address")} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-700">
        <input type="checkbox" {...register("isDefault")} />
        Set as default signature
      </label>
      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
