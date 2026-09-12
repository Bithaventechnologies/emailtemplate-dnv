"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createRecipientSchema, type CreateRecipientInput } from "@email-platform/types";
import { Input, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function RecipientForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Save recipient",
}: {
  defaultValues?: Partial<CreateRecipientInput>;
  onSubmit: (values: CreateRecipientInput) => void | Promise<void>;
  submitting?: boolean;
  submitLabel?: string;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateRecipientInput>({
    resolver: zodResolver(createRecipientSchema),
    defaultValues,
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <Label htmlFor="email" required>
          Email
        </Label>
        <Input id="email" type="email" error={errors.email?.message} {...register("email")} />
        <FieldError message={errors.email?.message} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="firstName">First name</Label>
          <Input id="firstName" {...register("firstName")} />
        </div>
        <div>
          <Label htmlFor="lastName">Last name</Label>
          <Input id="lastName" {...register("lastName")} />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...register("company")} />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" {...register("phone")} />
        </div>
      </div>
      <Button type="submit" loading={submitting}>
        {submitLabel}
      </Button>
    </form>
  );
}
