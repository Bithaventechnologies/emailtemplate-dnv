"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@email-platform/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, FieldError } from "@/components/ui/input";
import { apiClient } from "@/lib/api-client";
import { getErrorMessage } from "@/hooks/use-api-error";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/query-keys";

export default function LoginPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setServerError(null);
    setSubmitting(true);
    try {
      await apiClient.post("/auth/login", values);
      await queryClient.invalidateQueries({ queryKey: queryKeys.me() });
      router.replace("/dashboard");
    } catch (error) {
      setServerError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardBody>
        <h1 className="text-lg font-semibold text-ink-900">Sign in</h1>
        <p className="mt-1 text-sm text-ink-500">Welcome back. Enter your credentials to continue.</p>

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

          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>
                Password
              </Label>
              <Link href="/forgot-password" className="focus-ring rounded text-xs font-medium text-accent-600 hover:text-accent-700">
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              error={errors.password?.message}
              {...register("password")}
            />
            <FieldError message={errors.password?.message} />
          </div>

          <Button type="submit" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}
