"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { NAV_SECTIONS } from "./nav-config";

function isActive(pathname: string, href: string): boolean {
  const base = href.split("?")[0]!;
  if (base === "/dashboard") return pathname === "/dashboard";
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label="Primary" className="flex h-full flex-col overflow-y-auto px-3 py-4">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-ink-900 text-xs font-semibold text-white">
          E
        </div>
        <span className="text-sm font-semibold text-ink-900">Email Platform</span>
      </div>

      <ul className="space-y-1">
        {NAV_SECTIONS.map((section) => {
          if (!section.children) {
            const active = isActive(pathname, section.href!);
            return (
              <li key={section.label}>
                <Link
                  href={section.href!}
                  onClick={onNavigate}
                  className={cn(
                    "focus-ring flex items-center rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                    active ? "bg-ink-900 text-white" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                  )}
                >
                  {section.label}
                </Link>
              </li>
            );
          }

          const collapsed = collapsedSections[section.label];
          return (
            <li key={section.label} className="pt-2">
              <button
                type="button"
                onClick={() => setCollapsedSections((s) => ({ ...s, [section.label]: !s[section.label] }))}
                className="focus-ring flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400 hover:text-ink-600"
                aria-expanded={!collapsed}
              >
                {section.label}
                <svg
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className={cn("h-3.5 w-3.5 transition-transform", collapsed && "-rotate-90")}
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              {!collapsed ? (
                <ul className="mt-0.5 space-y-0.5">
                  {section.children.map((leaf) => {
                    const active = isActive(pathname, leaf.href);
                    return (
                      <li key={leaf.href}>
                        <Link
                          href={leaf.href}
                          onClick={onNavigate}
                          className={cn(
                            "focus-ring flex items-center rounded-md px-2.5 py-1.5 pl-4 text-sm transition-colors",
                            active ? "bg-accent-50 font-medium text-accent-700" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                          )}
                        >
                          {leaf.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
