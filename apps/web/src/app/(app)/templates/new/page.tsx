"use client";

import { TemplateEditorForm } from "@/components/templates/template-editor-form";

export default function NewTemplatePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">New template</h1>
        <p className="mt-1 text-sm text-ink-500">Build a branded email using content blocks.</p>
      </div>
      <TemplateEditorForm />
    </div>
  );
}
