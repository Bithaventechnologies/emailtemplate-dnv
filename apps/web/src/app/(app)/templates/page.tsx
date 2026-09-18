"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTemplates, useDeleteTemplate, useCreateTemplate, type EmailTemplateDto } from "@/hooks/use-templates";
import { useCategories } from "@/hooks/use-categories";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/input";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Menu, DotsIcon } from "@/components/ui/menu";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";

export default function TemplatesPage() {
  const router = useRouter();
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState("");
  const { data: templates, isLoading } = useTemplates(categoryId || undefined, status || undefined);
  const { data: categories } = useCategories();
  const deleteTemplate = useDeleteTemplate();
  const createTemplate = useCreateTemplate();
  const confirm = useConfirm();
  const { toast } = useToast();

  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name]));

  async function handleDelete(template: EmailTemplateDto) {
    const ok = await confirm({
      title: `Delete "${template.name}"?`,
      description: "This template will be archived and hidden from lists. This cannot be easily undone.",
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteTemplate.mutateAsync(template.id);
      toast({ title: "Template deleted", variant: "success" });
    } catch (error) {
      toast({ title: "Failed to delete template", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleDuplicate(template: EmailTemplateDto) {
    if (!template.currentVersion) {
      toast({ title: "Cannot duplicate", description: "This template has no saved content yet.", variant: "error" });
      return;
    }
    try {
      const created = await createTemplate.mutateAsync({
        name: `${template.name} (copy)`,
        categoryId: template.categoryId,
        classification: template.classification,
        subject: template.currentVersion.subject,
        previewText: template.currentVersion.previewText ?? undefined,
        body: template.currentVersion.bodyBlocksJson,
        variables: [],
      });
      toast({ title: "Template duplicated", variant: "success" });
      router.push(`/templates/${created.id}`);
    } catch (error) {
      toast({ title: "Failed to duplicate template", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-ink-900">Email templates</h1>
          <p className="mt-1 text-sm text-ink-500">Choose a template to edit or send, or create a new one.</p>
        </div>
        <Link href="/templates/new">
          <Button>+ Create template</Button>
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-48">
          <option value="">All categories</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-40">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ACTIVE">Active</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
      </div>

      <Card>
        {isLoading ? (
          <TableSkeleton />
        ) : !templates || templates.length === 0 ? (
          <EmptyState
            title="No templates yet"
            description="Create your first branded email template, then send it when you are ready."
            action={
              <Link href="/templates/new">
                <Button>Create template</Button>
              </Link>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase tracking-wide text-ink-400">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Classification</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {templates.map((t) => (
                  <tr key={t.id} className="hover:bg-ink-50">
                    <td className="px-5 py-3">
                      <Link href={`/templates/${t.id}`} className="focus-ring rounded font-medium text-ink-900 hover:text-accent-600">
                        {t.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-ink-600">{categoryNameById.get(t.categoryId) ?? "—"}</td>
                    <td className="px-5 py-3">
                      <Badge tone={t.classification === "MARKETING" ? "accent" : "neutral"}>{t.classification.toLowerCase()}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-5 py-3 text-ink-500">{new Date(t.updatedAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/templates/${t.id}`)}>Edit</Button>
                        <Button size="sm" disabled={t.status !== "ACTIVE"} onClick={() => router.push(`/compose?templateId=${t.id}`)}>Use template</Button>
                        <Menu trigger={<DotsIcon />} items={[
                          { label: "Duplicate", onClick: () => handleDuplicate(t) },
                          { label: "Delete", onClick: () => handleDelete(t), danger: true },
                        ]} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
