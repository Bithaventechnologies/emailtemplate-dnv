"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { EmailBlock, EmailDocument } from "@email-platform/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Input, Textarea, Select, Label, FieldError } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCategories } from "@/hooks/use-categories";
import { useCreateTemplate, useUpdateTemplate, usePreviewTemplate, type EmailTemplateDto } from "@/hooks/use-templates";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import { BlockListEditor } from "./block-list-editor";
import { VariableSidebar } from "./variable-sidebar";
import { BlockPreview } from "./block-preview";
import type { FocusRegistrar } from "./block-editors";

interface FormState {
  name: string;
  categoryId: string;
  classification: "TRANSACTIONAL" | "MARKETING";
  subject: string;
  previewText: string;
  blocks: EmailBlock[];
}

export function TemplateEditorForm({ existing }: { existing?: EmailTemplateDto }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: categories } = useCategories();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate(existing?.id ?? "__none__");
  const previewMutation = usePreviewTemplate(existing?.id ?? "__none__");

  const [form, setForm] = useState<FormState>({
    name: existing?.name ?? "",
    categoryId: existing?.categoryId ?? "",
    classification: existing?.classification ?? "TRANSACTIONAL",
    subject: existing?.currentVersion?.subject ?? "",
    previewText: existing?.currentVersion?.previewText ?? "",
    blocks: existing?.currentVersion?.bodyBlocksJson.blocks ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [serverPreviewHtml, setServerPreviewHtml] = useState<string | null>(null);

  const focusSettersRef = useRef<Record<string, (token: string) => void>>({});

  function registerFocusForBlock(blockId: string): FocusRegistrar {
    return (setter) => {
      focusSettersRef.current[blockId] = setter;
      focusSettersRef.current.__last = setter;
    };
  }

  function insertVariable(token: string) {
    const setter = focusSettersRef.current.__last;
    if (setter) {
      setter(token);
    } else {
      toast({ title: "Click into a text field first", description: "Then click a variable to insert it there.", variant: "info" });
    }
  }

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required";
    if (!form.categoryId) next.categoryId = "Category is required";
    if (!form.subject.trim()) next.subject = "Subject is required";
    if (form.blocks.length === 0) next.blocks = "Add at least one content block";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(publish: boolean) {
    if (!validate()) return;
    const body: EmailDocument = { blocks: form.blocks };

    try {
      if (existing) {
        await updateTemplate.mutateAsync({
          name: form.name,
          categoryId: form.categoryId,
          classification: form.classification,
          subject: form.subject,
          previewText: form.previewText || undefined,
          body,
          status: publish ? "ACTIVE" : undefined,
        });
        toast({ title: "Template saved", variant: "success" });
      } else {
        const created = await createTemplate.mutateAsync({
          name: form.name,
          categoryId: form.categoryId,
          classification: form.classification,
          subject: form.subject,
          previewText: form.previewText || undefined,
          body,
          variables: [],
        });
        toast({ title: "Template created", variant: "success" });
        router.push(`/templates/${created.id}`);
      }
    } catch (error) {
      toast({ title: "Failed to save template", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleServerPreview() {
    if (!existing) {
      toast({ title: "Save the template first", description: "Server preview requires a saved template.", variant: "info" });
      return;
    }
    try {
      const result = await previewMutation.mutateAsync({});
      setServerPreviewHtml(result.html);
      if (result.unresolvedVariables.length > 0) {
        toast({
          title: "Unresolved variables",
          description: result.unresolvedVariables.join(", "),
          variant: "info",
        });
      }
    } catch (error) {
      toast({ title: "Preview failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  const saving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_1fr_380px]">
      <div className="hidden xl:block">
        <VariableSidebar onInsert={insertVariable} />
      </div>

      <div className="space-y-6 xl:hidden">
        <VariableSidebar onInsert={insertVariable} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader title="Template details" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="name" required>
                  Name
                </Label>
                <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} error={errors.name} />
                <FieldError message={errors.name} />
              </div>
              <div>
                <Label htmlFor="category" required>
                  Category
                </Label>
                <Select id="category" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} error={errors.categoryId}>
                  <option value="">Select a category</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.categoryId} />
              </div>
              <div>
                <Label htmlFor="classification">Classification</Label>
                <Select
                  id="classification"
                  value={form.classification}
                  onChange={(e) => setForm((f) => ({ ...f, classification: e.target.value as FormState["classification"] }))}
                >
                  <option value="TRANSACTIONAL">Transactional</option>
                  <option value="MARKETING">Marketing</option>
                </Select>
              </div>
              {existing ? (
                <div>
                  <Label>Status</Label>
                  <div className="pt-1.5">
                    <Badge tone={existing.status === "ACTIVE" ? "success" : "neutral"}>{existing.status}</Badge>
                  </div>
                </div>
              ) : null}
            </div>
            <div>
              <Label htmlFor="subject" required>
                Subject
              </Label>
              <Input id="subject" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} error={errors.subject} />
              <FieldError message={errors.subject} />
            </div>
            <div>
              <Label htmlFor="previewText">Preview text</Label>
              <Textarea
                id="previewText"
                rows={2}
                value={form.previewText}
                onChange={(e) => setForm((f) => ({ ...f, previewText: e.target.value }))}
              />
            </div>
          </CardBody>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink-800">Content blocks</h2>
          <BlockListEditor blocks={form.blocks} onChange={(blocks) => setForm((f) => ({ ...f, blocks }))} registerFocusForBlock={registerFocusForBlock} />
          <FieldError message={errors.blocks} />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleSave(false)} loading={saving}>
            Save draft
          </Button>
          <Button variant="secondary" onClick={() => handleSave(true)} loading={saving}>
            Save &amp; activate
          </Button>
          {existing ? (
            <Button variant="outline" onClick={handleServerPreview} loading={previewMutation.isPending}>
              Server preview
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-800">Preview</h2>
          <div className="flex rounded-md border border-ink-200 p-0.5">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={`focus-ring rounded px-2.5 py-1 text-xs font-medium ${viewport === "desktop" ? "bg-ink-900 text-white" : "text-ink-600"}`}
            >
              Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={`focus-ring rounded px-2.5 py-1 text-xs font-medium ${viewport === "mobile" ? "bg-ink-900 text-white" : "text-ink-600"}`}
            >
              Mobile
            </button>
          </div>
        </div>
        <Card className="overflow-hidden">
          {serverPreviewHtml ? (
            <div>
              <div className="flex items-center justify-between border-b border-ink-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                Showing server-rendered preview
                <button className="focus-ring underline" onClick={() => setServerPreviewHtml(null)}>
                  Back to live preview
                </button>
              </div>
              <iframe title="Server preview" srcDoc={serverPreviewHtml} className="h-[600px] w-full bg-white" />
            </div>
          ) : (
            <BlockPreview blocks={form.blocks} subject={form.subject} previewText={form.previewText} viewport={viewport} />
          )}
        </Card>
      </div>
    </div>
  );
}
