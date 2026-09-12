import { cn } from "@/lib/cn";

export const WIZARD_STEPS = [
  "Category",
  "Template",
  "Recipients",
  "Variables",
  "Branding",
  "Preview",
  "Confirm",
] as const;

export function WizardStepper({ currentStep }: { currentStep: number }) {
  return (
    <ol className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
      {WIZARD_STEPS.map((label, i) => (
        <li key={label} className={cn("flex items-center gap-1.5", i === currentStep ? "text-accent-700" : i < currentStep ? "text-emerald-600" : "text-ink-400")}>
          <span
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[10px]",
              i === currentStep ? "bg-accent-100" : i < currentStep ? "bg-emerald-100" : "bg-ink-100",
            )}
          >
            {i < currentStep ? "✓" : i + 1}
          </span>
          {label}
        </li>
      ))}
    </ol>
  );
}
