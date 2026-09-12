"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@email-platform/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/hooks/use-api-error";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/auth/reset-password", values);
      router.replace("/login");
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <h1 className="text-lg font-semibold text-ink-900">Set a new password</h1>
        <p className="mt-1 text-sm text-ink-500">Choose a strong password for your account.</p>

        {!token ? (
          <div role="alert" className="mt-6 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            This reset link is missing a token. Please request a new one.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError ? (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            ) : null}
            <input type="hidden" {...register("token")} />
            <div>
              <Label htmlFor="password" required>
                New password
              </Label>
              <Input id="password" type="password" autoComplete="new-password" error={errors.password?.message} {...register("password")} />
              <FieldError message={errors.password?.message} />
              <p className="mt-1 text-xs text-ink-400">At least 12 characters, with upper, lower, number and symbol.</p>
            </div>
            <Button type="submit" className="w-full" loading={submitting}>
              Reset password
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-500">
          <Link href="/login" className="focus-ring rounded font-medium text-accent-600 hover:text-accent-700">
            Back to sign in
          </Link>
        </p>
      </CardBody>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}
