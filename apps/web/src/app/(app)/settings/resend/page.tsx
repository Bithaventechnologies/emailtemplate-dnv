"use client";

import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ResendSettingsPage() {
  // The API never exposes the real Resend API key or webhook secret to the
  // frontend. This page only reflects that sending is configured server-side
  // via environment variables (RESEND_API_KEY, RESEND_WEBHOOK_SECRET).
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Resend connection</h1>
        <p className="mt-1 text-sm text-ink-500">Email delivery is powered by Resend, configured on the server.</p>
      </div>

      <Card>
        <CardHeader title="Connection status" />
        <CardBody className="space-y-4">
          <Row label="API key" value="••••••••" tone="success" />
          <Row label="Webhook secret" value="••••••••" tone="success" />
          <Row label="From address" value="Configured" tone="success" />
          <p className="text-xs text-ink-400">
            For security, API credentials are never sent to or displayed in the browser. To rotate credentials, update
            the server environment variables and restart the API.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" }) {
  return (
    <div className="flex items-center justify-between border-b border-ink-100 pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-ink-600">{label}</span>
      <div className="flex items-center gap-2">
        <Badge tone={tone}>Configured</Badge>
        <span className="font-mono text-sm text-ink-500">{value}</span>
      </div>
    </div>
  );
}
