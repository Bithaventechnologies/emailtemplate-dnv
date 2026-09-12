"use client";

import { useParams } from "next/navigation";
import { useTemplate } from "@/hooks/use-templates";
import { TemplateEditorForm } from "@/components/templates/template-editor-form";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();
  const { data: template, isLoading, isError } = useTemplate(params.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !template) {
    return (
      <Card>
        <EmptyState title="Template not found" description="It may have been deleted or you may not have access." />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">{template.name}</h1>
        <p className="mt-1 text-sm text-ink-500">Edit this template's content, subject, and variables.</p>
      </div>
      <TemplateEditorForm existing={template} />
    </div>
  );
}
