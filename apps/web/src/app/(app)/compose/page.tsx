"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getBulkSendConfirmationTier } from "@email-platform/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { getErrorMessage } from "@/hooks/use-api-error";
import { useCategories } from "@/hooks/use-categories";
import { useTemplates, usePreviewTemplate, useSendTestEmail } from "@/hooks/use-templates";
import { useRecipientLists, useImportPreview, useConfirmImport } from "@/hooks/use-recipients";
import { useSignatures } from "@/hooks/use-signatures";
import { useCreateCampaign, useSendCampaign, generateIdempotencyKey } from "@/hooks/use-campaigns";
import { useComposeStore } from "@/store/compose-store";
import { WizardStepper, WIZARD_STEPS } from "@/components/compose/wizard-shell";
import { BlockPreview } from "@/components/templates/block-preview";

export default function ComposePage() {
  const router = useRouter();
  const { toast } = useToast();
  const confirm = useConfirm();
  const store = useComposeStore();

  const { data: categories } = useCategories();
  const { data: templates } = useTemplates(store.categoryId || undefined, "ACTIVE");
  const { data: recipientLists } = useRecipientLists();
  const { data: signatures } = useSignatures();

  const selectedTemplate = templates?.find((t) => t.id === store.templateId);

  const importPreview = useImportPreview();
  const confirmImport = useConfirmImport();
  const previewMutation = usePreviewTemplate(store.templateId || "__none__");
  const sendTestMutation = useSendTestEmail(store.templateId || "__none__");
  const createCampaign = useCreateCampaign();
  const [createdCampaignId, setCreatedCampaignId] = useState<string | null>(null);
  const sendCampaign = useSendCampaign(createdCampaignId ?? "__none__");

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [manualEmailsText, setManualEmailsText] = useState("");
  const [serverPreview, setServerPreview] = useState<{ subject: string; html: string; unresolvedVariables: string[] } | null>(null);
  const [idempotencyKey] = useState(() => generateIdempotencyKey());
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [typedCountConfirmation, setTypedCountConfirmation] = useState("");

  const recipientCountEstimate = useMemo(() => {
    if (store.recipientSource === "manual") return manualEmailsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length;
    return 0; // list/csv counts are only known server-side after confirm
  }, [store.recipientSource, manualEmailsText]);

  function goNext() {
    store.setStep(Math.min(store.step + 1, WIZARD_STEPS.length - 1));
  }
  function goBack() {
    store.setStep(Math.max(store.step - 1, 0));
  }

  function canProceed(): boolean {
    switch (store.step) {
      case 0:
        return !!store.categoryId;
      case 1:
        return !!store.templateId;
      case 2:
        if (store.recipientSource === "list") return !!store.recipientListId;
        if (store.recipientSource === "manual") return recipientCountEstimate > 0;
        if (store.recipientSource === "csv") return !!csvFile || !!store.csvFileAssetId;
        return false;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      default:
        return true;
    }
  }

  async function handleUploadCsv() {
    if (!csvFile) return;
    try {
      const result = await importPreview.mutateAsync(csvFile);
      store.setCsvFileAssetId(result.fileAssetId);
      toast({ title: "CSV analyzed", description: `${result.validEmails} valid emails found.`, variant: "success" });
    } catch (error) {
      toast({ title: "Upload failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleServerPreview() {
    try {
      const result = await previewMutation.mutateAsync(store.variableMapping);
      setServerPreview(result);
    } catch (error) {
      toast({ title: "Preview failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleSendTest() {
    if (!store.testEmail) {
      toast({ title: "Enter a test email address", variant: "error" });
      return;
    }
    try {
      await sendTestMutation.mutateAsync({ toEmail: store.testEmail, sampleVariables: store.variableMapping });
      toast({ title: "Test email sent", description: `Sent to ${store.testEmail}`, variant: "success" });
    } catch (error) {
      toast({ title: "Failed to send test", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleCreateAndConfirmRecipients(): Promise<{ recipientListId?: string } | null> {
    if (store.recipientSource === "csv" && store.csvFileAssetId) {
      try {
        const res = await confirmImport.mutateAsync({
          fileAssetId: store.csvFileAssetId,
          columnMappings: [{ csvHeader: "email", mappedTo: "email" }],
          newListName: `Compose import ${new Date().toISOString().slice(0, 10)}`,
        });
        return { recipientListId: res.listId };
      } catch (error) {
        toast({ title: "Failed to import recipients", description: getErrorMessage(error), variant: "error" });
        return null;
      }
    }
    return {};
  }

  async function handleCreateCampaign() {
    if (!store.campaignName.trim()) {
      toast({ title: "Enter a campaign name", variant: "error" });
      return;
    }
    const manualEmails =
      store.recipientSource === "manual"
        ? manualEmailsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
        : undefined;

    let recipientListId = store.recipientSource === "list" ? store.recipientListId : undefined;
    if (store.recipientSource === "csv") {
      const imported = await handleCreateAndConfirmRecipients();
      if (!imported) return;
      recipientListId = imported.recipientListId;
    }

    try {
      const campaign = await createCampaign.mutateAsync({
        name: store.campaignName,
        templateId: store.templateId,
        recipientListId,
        manualRecipientEmails: manualEmails,
        signatureId: store.signatureId || undefined,
        customVariableOverrides: store.variableMapping,
      });
      setCreatedCampaignId(campaign.id);
      setConfirmedCount(campaign.totalRecipients);
      toast({ title: "Campaign created", description: `${campaign.totalRecipients} recipients queued.`, variant: "success" });
      goNext();
    } catch (error) {
      toast({ title: "Failed to create campaign", description: getErrorMessage(error), variant: "error" });
    }
  }

  async function handleSend() {
    if (!createdCampaignId) return;
    const tier = getBulkSendConfirmationTier(confirmedCount);

    if (tier === "explicit") {
      if (typedCountConfirmation.trim() !== String(confirmedCount)) {
        toast({ title: "Type the exact recipient count to confirm", variant: "error" });
        return;
      }
    } else {
      const ok = await confirm({
        title: `Send to ${confirmedCount} recipient${confirmedCount === 1 ? "" : "s"}?`,
        description:
          tier === "enhanced"
            ? "This is a larger send. Double-check your template and recipient list before continuing."
            : "This will queue emails for immediate sending.",
        confirmLabel: "Send campaign",
        destructive: tier === "enhanced",
      });
      if (!ok) return;
    }

    try {
      await sendCampaign.mutateAsync({ idempotencyKey, confirmedRecipientCount: confirmedCount });
      toast({ title: "Campaign is sending", variant: "success" });
      router.push(`/campaigns/${createdCampaignId}`);
      store.reset();
    } catch (error) {
      toast({ title: "Failed to send campaign", description: getErrorMessage(error), variant: "error" });
    }
  }

  const tier = getBulkSendConfirmationTier(confirmedCount);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Compose email</h1>
        <p className="mt-1 text-sm text-ink-500">Send a branded campaign in a few guided steps.</p>
      </div>

      <WizardStepper currentStep={store.step} />

      <Card>
        <CardBody className="space-y-5">
          {store.step === 0 ? (
            <div>
              <Label required>Category</Label>
              <Select value={store.categoryId} onChange={(e) => store.setCategoryId(e.target.value)}>
                <option value="">Select a category</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {store.step === 1 ? (
            <div>
              <Label required>Template</Label>
              {!templates || templates.length === 0 ? (
                <p className="text-sm text-ink-500">No active templates in this category.</p>
              ) : (
                <div className="space-y-2">
                  {templates.map((t) => (
                    <label
                      key={t.id}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
                        store.templateId === t.id ? "border-accent-400 bg-accent-50" : "border-ink-200"
                      }`}
                    >
                      <div>
                        <input
                          type="radio"
                          name="template"
                          className="sr-only"
                          checked={store.templateId === t.id}
                          onChange={() => store.setTemplateId(t.id)}
                        />
                        <p className="text-sm font-medium text-ink-900">{t.name}</p>
                        <p className="text-xs text-ink-500">{t.currentVersion?.subject}</p>
                      </div>
                      <Badge tone={t.classification === "MARKETING" ? "accent" : "neutral"}>{t.classification.toLowerCase()}</Badge>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ) : null}

          {store.step === 2 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                {(["list", "csv", "manual"] as const).map((source) => (
                  <label key={source} className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={store.recipientSource === source} onChange={() => store.setRecipientSource(source)} />
                    {source === "list" ? "Recipient list" : source === "csv" ? "Upload CSV" : "Paste emails"}
                  </label>
                ))}
              </div>

              {store.recipientSource === "list" ? (
                <Select value={store.recipientListId} onChange={(e) => store.setRecipientListId(e.target.value)}>
                  <option value="">Select a list</option>
                  {recipientLists?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              ) : null}

              {store.recipientSource === "csv" ? (
                <div className="space-y-2">
                  <input type="file" accept=".csv,text/csv" onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)} />
                  <Button variant="outline" size="sm" onClick={handleUploadCsv} loading={importPreview.isPending} disabled={!csvFile}>
                    Analyze CSV
                  </Button>
                  {store.csvFileAssetId ? <p className="text-xs text-emerald-600">File ready for import.</p> : null}
                </div>
              ) : null}

              {store.recipientSource === "manual" ? (
                <div>
                  <Label>Emails (comma or newline separated)</Label>
                  <Textarea rows={5} value={manualEmailsText} onChange={(e) => setManualEmailsText(e.target.value)} />
                  <p className="mt-1 text-xs text-ink-500">{recipientCountEstimate} email(s) detected</p>
                </div>
              ) : null}
            </div>
          ) : null}

          {store.step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-600">
                Map custom variable overrides that apply to every recipient in this send (recipient-specific fields like first
                name are resolved automatically).
              </p>
              <VariableOverrideEditor value={store.variableMapping} onChange={store.setVariableMapping} />
            </div>
          ) : null}

          {store.step === 4 ? (
            <div>
              <Label>Signature (optional)</Label>
              <Select value={store.signatureId} onChange={(e) => store.setSignatureId(e.target.value)}>
                <option value="">No signature</option>
                {signatures?.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isDefault ? "(default)" : ""}
                  </option>
                ))}
              </Select>
              <p className="mt-2 text-xs text-ink-500">Branding is applied automatically from your organization&apos;s branding settings.</p>
            </div>
          ) : null}

          {store.step === 5 ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleServerPreview} loading={previewMutation.isPending}>
                  Load server preview
                </Button>
                <div className="flex flex-1 items-center gap-2">
                  <Input placeholder="test@yourcompany.com" value={store.testEmail} onChange={(e) => store.setTestEmail(e.target.value)} className="max-w-xs" />
                  <Button variant="outline" size="sm" onClick={handleSendTest} loading={sendTestMutation.isPending}>
                    Send test
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-lg border border-ink-100">
                {serverPreview ? (
                  <iframe title="Server preview" srcDoc={serverPreview.html} className="h-[500px] w-full bg-white" />
                ) : selectedTemplate?.currentVersion ? (
                  <BlockPreview blocks={selectedTemplate.currentVersion.bodyBlocksJson.blocks} subject={selectedTemplate.currentVersion.subject} variables={store.variableMapping} />
                ) : (
                  <p className="p-6 text-sm text-ink-500">Select a template to preview.</p>
                )}
              </div>
              <div>
                <Label required>Campaign name</Label>
                <Input value={store.campaignName} onChange={(e) => store.setCampaignName(e.target.value)} placeholder="e.g. October product update" />
              </div>
            </div>
          ) : null}

          {store.step === 6 ? (
            <div className="space-y-4">
              {!createdCampaignId ? (
                <div className="text-center">
                  <p className="text-sm text-ink-600">Ready to create your campaign and queue recipients.</p>
                  <Button className="mt-4" onClick={handleCreateCampaign} loading={createCampaign.isPending || confirmImport.isPending}>
                    Create campaign
                  </Button>
                </div>
              ) : (
                <div className="space-y-4 text-center">
                  <p className="text-sm text-ink-700">
                    Campaign created with <strong>{confirmedCount}</strong> recipient(s).
                  </p>
                  {tier === "explicit" ? (
                    <div className="mx-auto max-w-xs text-left">
                      <Label htmlFor="typed-count">Type &quot;{confirmedCount}&quot; to confirm this large send</Label>
                      <Input id="typed-count" value={typedCountConfirmation} onChange={(e) => setTypedCountConfirmation(e.target.value)} />
                    </div>
                  ) : null}
                  <Button
                    onClick={handleSend}
                    loading={sendCampaign.isPending}
                    disabled={tier === "explicit" && typedCountConfirmation.trim() !== String(confirmedCount)}
                  >
                    Send campaign
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </CardBody>
      </Card>

      {store.step < 6 ? (
        <div className="flex justify-between">
          <Button variant="outline" onClick={goBack} disabled={store.step === 0}>
            Back
          </Button>
          <Button onClick={goNext} disabled={!canProceed()}>
            Continue
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function VariableOverrideEditor({ value, onChange }: { value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  const entries = Object.entries(value);
  return (
    <div className="space-y-2">
      {entries.map(([key, val], idx) => (
        <div key={idx} className="flex gap-2">
          <Input
            placeholder="variableKey"
            value={key}
            onChange={(e) => {
              const next = { ...value };
              delete next[key];
              next[e.target.value] = val;
              onChange(next);
            }}
            className="max-w-[180px]"
          />
          <Input
            placeholder="value"
            value={val}
            onChange={(e) => onChange({ ...value, [key]: e.target.value })}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const next = { ...value };
              delete next[key];
              onChange(next);
            }}
            aria-label="Remove variable"
          >
            ✕
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange({ ...value, "": "" })}>
        Add variable
      </Button>
    </div>
  );
}
