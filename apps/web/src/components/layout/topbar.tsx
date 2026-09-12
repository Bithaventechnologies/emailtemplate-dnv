"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { useAuth } from "@/hooks/use-auth";
import { Menu } from "@/components/ui/menu";
import { useToast } from "@/components/ui/toast";

export function Topbar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // even if the call fails, clear local state and redirect
    } finally {
      queryClient.clear();
      setLoggingOut(false);
      router.replace("/login");
    }
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-ink-100 bg-white/90 px-4 backdrop-blur">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="focus-ring -ml-1.5 flex h-9 w-9 items-center justify-center rounded-md text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Open navigation menu"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
          <path fillRule="evenodd" d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 10.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zM2 10a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 10z" clipRule="evenodd" />
        </svg>
      </button>
      <div className="hidden lg:block" />
      <Menu
        trigger={
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-xs font-semibold text-accent-700">
            {initials}
          </span>
        }
        items={[
          { label: user?.email ?? "Account", onClick: () => router.push("/settings/security"), disabled: true },
          { label: loggingOut ? "Signing out..." : "Sign out", onClick: handleLogout, danger: true },
        ]}
      />
    </header>
  );
}
