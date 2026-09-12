"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** If set, the confirm button stays disabled until the user types this exact string. */
  requireTypedConfirmation?: string;
  typedConfirmationLabel?: string;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function useConfirm(): ConfirmContextValue["confirm"] {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx.confirm;
}

interface PendingState extends ConfirmOptions {
  resolve: (value: boolean) => void;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null);
  const [typedValue, setTypedValue] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setTypedValue("");
      setPending({ ...options, resolve });
    });
  }, []);

  const close = useCallback(
    (result: boolean) => {
      pending?.resolve(result);
      setPending(null);
    },
    [pending],
  );

  useEffect(() => {
    if (!pending) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = dialogRef.current;
    node?.querySelector<HTMLElement>("[data-autofocus]")?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close(false);
      if (e.key === "Tab" && node) {
        const focusables = node.querySelectorAll<HTMLElement>(
          'button, input, [href], [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0]!;
        const last = focusables[focusables.length - 1]!;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus();
    };
  }, [pending, close]);

  const requiresTyped = !!pending?.requireTypedConfirmation;
  const canConfirm = !requiresTyped || typedValue.trim() === pending?.requireTypedConfirmation;

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {pending ? (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-ink-950/40 p-4 animate-fade-in">
          <div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-popover animate-slide-up"
          >
            <h2 id={titleId} className="text-base font-semibold text-ink-900">
              {pending.title}
            </h2>
            {pending.description ? (
              <div className="mt-2 text-sm text-ink-600">{pending.description}</div>
            ) : null}

            {requiresTyped ? (
              <div className="mt-3">
                <label className="mb-1 block text-xs font-medium text-ink-600">
                  {pending.typedConfirmationLabel ?? `Type "${pending.requireTypedConfirmation}" to confirm`}
                </label>
                <input
                  data-autofocus
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  className="focus-ring w-full rounded-md border border-ink-200 px-3 py-2 text-sm"
                  autoComplete="off"
                />
              </div>
            ) : null}

            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => close(false)} data-autofocus={!requiresTyped ? true : undefined}>
                {pending.cancelLabel ?? "Cancel"}
              </Button>
              <Button
                variant={pending.destructive ? "danger" : "primary"}
                onClick={() => close(true)}
                disabled={!canConfirm}
              >
                {pending.confirmLabel ?? "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}
