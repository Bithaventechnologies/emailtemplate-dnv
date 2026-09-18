export interface NavLeaf {
  label: string;
  href: string;
}

export interface NavSection {
  label: string;
  href?: string;
  children?: NavLeaf[];
}

export const NAV_SECTIONS: NavSection[] = [
  { label: "Dashboard", href: "/dashboard" },
  {
    label: "Email",
    children: [
      { label: "Email Templates", href: "/templates" },
      { label: "Send Email", href: "/compose" },
      { label: "Campaigns", href: "/campaigns" },
      { label: "Sent", href: "/campaigns?tab=sent" },
      { label: "Failed", href: "/failed-emails" },
      { label: "Tracking", href: "/analytics" },
    ],
  },
  {
    label: "Recipients",
    children: [
      { label: "Lists", href: "/recipients/lists" },
      { label: "Import CSV", href: "/recipients/import" },
      { label: "Add Recipient", href: "/recipients/new" },
      { label: "Export", href: "/recipients?export=1" },
    ],
  },
  {
    label: "Branding",
    children: [
      { label: "Company Profile", href: "/branding" },
      { label: "Logo", href: "/branding#logo" },
      { label: "Signature", href: "/signatures" },
      { label: "Appearance", href: "/branding#appearance" },
    ],
  },
  {
    label: "Settings",
    children: [
      { label: "Email", href: "/settings/email" },
      { label: "Resend", href: "/settings/resend" },
      { label: "Security", href: "/settings/security" },
      { label: "Audit Logs", href: "/settings/audit-logs" },
    ],
  },
];
