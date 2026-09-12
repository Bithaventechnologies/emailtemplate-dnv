"use client";

import { Card, CardHeader } from "@/components/ui/card";

export interface VariableGroupItem {
  key: string;
  label: string;
}

export interface VariableGroups {
  Recipient: VariableGroupItem[];
  Request: VariableGroupItem[];
  System: VariableGroupItem[];
  Branding: VariableGroupItem[];
}

export const DEFAULT_VARIABLE_GROUPS: VariableGroups = {
  Recipient: [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "company", label: "Company" },
  ],
  Request: [
    { key: "requestId", label: "Request ID" },
    { key: "actionUrl", label: "Action URL" },
  ],
  System: [{ key: "currentDate", label: "Current Date" }],
  Branding: [
    { key: "companyName", label: "Company Name" },
    { key: "signature", label: "Signature" },
  ],
};

/**
 * A sidebar listing insertable {{variable}} tokens grouped by source.
 * onInsert receives the raw token text (e.g. "{{firstName}}") to be inserted
 * at the caller's last-known focused-field insertion point.
 */
export function VariableSidebar({
  groups = DEFAULT_VARIABLE_GROUPS,
  onInsert,
}: {
  groups?: VariableGroups;
  onInsert: (token: string) => void;
}) {
  return (
    <Card>
      <CardHeader title="Variables" description="Click to insert into the focused field" />
      <div className="max-h-[520px] space-y-4 overflow-y-auto p-4">
        {(Object.keys(groups) as Array<keyof VariableGroups>).map((group) => (
          <div key={group}>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">{group}</p>
            <div className="flex flex-wrap gap-1.5">
              {groups[group].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onInsert(`{{${item.key}}}`)}
                  title={`Insert {{${item.key}}}`}
                  className="focus-ring rounded-md border border-ink-200 bg-ink-50 px-2 py-1 text-xs font-medium text-ink-700 hover:border-accent-300 hover:bg-accent-50 hover:text-accent-700"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
