"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@email-platform/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/hooks/use-api-error";

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/auth/forgot-password", values);
      setSent(true);
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <h1 className="text-lg font-semibold text-ink-900">Reset your password</h1>
        <p className="mt-1 text-sm text-ink-500">We&apos;ll email you a link to reset it.</p>

        {sent ? (
          <div role="status" className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
            If an account exists for that email, a reset link has been sent.
          </div>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            {serverError ? (
              <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {serverError}
              </div>
            ) : null}
            <div>
              <Label htmlFor="email" required>
                Email
              </Label>
              <Input id="email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
              <FieldError message={errors.email?.message} />
            </div>
            <Button type="submit" className="w-full" loading={submitting}>
              Send reset link
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
