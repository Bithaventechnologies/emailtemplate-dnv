import { cn } from "@/lib/cn";

type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: "bg-ink-100 text-ink-700",
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  info: "bg-sky-50 text-sky-700 ring-1 ring-inset ring-sky-200",
  accent: "bg-accent-50 text-accent-700 ring-1 ring-inset ring-accent-200",
};

export function Badge({ tone = "neutral", children, className }: { tone?: BadgeTone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const STATUS_TONE: Record<string, BadgeTone> = {
  DRAFT: "neutral",
  ACTIVE: "success",
  ARCHIVED: "neutral",
  SCHEDULED: "info",
  QUEUED: "info",
  SENDING: "warning",
  COMPLETED: "success",
  PARTIALLY_FAILED: "warning",
  FAILED: "danger",
  CANCELLED: "neutral",
  DELIVERED: "success",
  BOUNCED: "danger",
  OPENED: "accent",
  CLICKED: "accent",
  SUPPRESSED: "neutral",
  PROCESSING: "info",
  SENT: "info",
  ACTIVE_RECIPIENT: "success",
  INVALID: "danger",
  UNSUBSCRIBED: "neutral",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={STATUS_TONE[status] ?? "neutral"}>{status.replaceAll("_", " ").toLowerCase()}</Badge>;
}
