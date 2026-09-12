"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/hooks/use-api-error";

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const confirm = useConfirm();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOutEverywhere() {
    const ok = await confirm({
      title: "Sign out of all sessions?",
      description: "You'll need to sign in again on this and any other device.",
      confirmLabel: "Sign out everywhere",
      destructive: true,
    });
    if (!ok) return;
    setSigningOut(true);
    try {
      await apiClient.post("/auth/logout");
      queryClient.clear();
      router.replace("/login");
    } catch (error) {
      toast({ title: "Failed to sign out", description: getErrorMessage(error), variant: "error" });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Security</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your account session and password.</p>
      </div>

      <Card>
        <CardHeader title="Account" />
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between border-b border-ink-100 py-2">
            <span className="text-ink-500">Name</span>
            <span className="font-medium text-ink-900">{user?.name}</span>
          </div>
          <div className="flex justify-between border-b border-ink-100 py-2">
            <span className="text-ink-500">Email</span>
            <span className="font-medium text-ink-900">{user?.email}</span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-ink-500">Role</span>
            <span className="font-medium text-ink-900">{user?.role}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Password" description="To reset your password, sign out and use 'Forgot password' on the login screen." />
        <CardBody>
          <a href="/forgot-password">
            <Button variant="outline" size="sm">
              Reset password
            </Button>
          </a>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Session" description="Your session is stored securely in an httpOnly cookie and expires after 7 days of inactivity." />
        <CardBody>
          <Button variant="danger" onClick={handleSignOutEverywhere} loading={signingOut}>
            Sign out
          </Button>
        </CardBody>
      </Card>
    </div>
  );
}
