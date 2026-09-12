import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  trend,
  tone = "neutral",
}: {
  label: string;
  value: string;
  trend?: { direction: "up" | "down" | "flat"; label: string };
  tone?: "neutral" | "danger";
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", tone === "danger" ? "text-red-600" : "text-ink-900")}>
        {value}
      </p>
      {trend ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1 text-xs font-medium",
            trend.direction === "up" && tone !== "danger" ? "text-emerald-600" : "",
            trend.direction === "down" && tone !== "danger" ? "text-red-600" : "",
            trend.direction === "up" && tone === "danger" ? "text-red-600" : "",
            trend.direction === "down" && tone === "danger" ? "text-emerald-600" : "",
            trend.direction === "flat" ? "text-ink-400" : "",
          )}
        >
          {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"} {trend.label}
        </p>
      ) : null}
    </div>
  );
}
