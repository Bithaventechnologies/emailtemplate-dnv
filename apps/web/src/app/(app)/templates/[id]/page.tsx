"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useTemplate } from "@/hooks/use-templates";
import { TemplateEditorForm } from "@/components/templates/template-editor-form";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/templates" className="focus-ring rounded text-sm text-ink-500 hover:text-ink-800">← Email templates</Link>
          <h1 className="mt-2 text-xl font-semibold text-ink-900">{template.name}</h1>
          <p className="mt-1 text-sm text-ink-500">Edit the email, then use it when you are ready to send.</p>
        </div>
        {template.status === "ACTIVE" ? <Link href={`/compose?templateId=${template.id}`}><Button>Use template</Button></Link> : <Button disabled>Activate to use</Button>}
      </div>
      <TemplateEditorForm existing={template} />
    </div>
  );
}
