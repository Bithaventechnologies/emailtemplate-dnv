"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { KNOWN_RECIPIENT_FIELDS, type CsvImportSummary } from "@email-platform/types";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Label, Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useImportPreview, useConfirmImport, useRecipientLists } from "@/hooks/use-recipients";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/hooks/use-api-error";
import { cn } from "@/lib/cn";

type Step = "upload" | "map" | "review" | "done";

const FIELD_LABELS: Record<string, string> = {
  email: "Email",
  firstName: "First name",
  lastName: "Last name",
  company: "Company",
  phone: "Phone",
};

export default function ImportRecipientsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const importPreview = useImportPreview();
  const confirmImport = useConfirmImport();
  const { data: lists } = useRecipientLists();

  const [step, setStep] = useState<Step>("upload");
  const [preview, setPreview] = useState<({ fileAssetId: string } & CsvImportSummary) | null>(null);
  const [mapping, setMapping] = useState<Record<string, string | null>>({});
  const [listMode, setListMode] = useState<"none" | "existing" | "new">("none");
  const [targetListId, setTargetListId] = useState("");
  const [newListName, setNewListName] = useState("");
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      toast({ title: "Invalid file", description: "Please upload a .csv file.", variant: "error" });
      return;
    }
    try {
      const result = await importPreview.mutateAsync(file);
      setPreview(result);
      const initialMapping: Record<string, string | null> = {};
      for (const header of result.headers) {
        const normalized = header.trim().toLowerCase();
        const match = KNOWN_RECIPIENT_FIELDS.find((f) => f.toLowerCase() === normalized);
        initialMapping[header] = match ?? null;
      }
      setMapping(initialMapping);
      setStep("map");
    } catch (error) {
      toast({ title: "Upload failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  function goToReview() {
    if (!Object.values(mapping).includes("email")) {
      toast({ title: "Map an email column", description: "One CSV column must be mapped to 'email'.", variant: "error" });
      return;
    }
    setStep("review");
  }

  async function handleConfirm() {
    if (!preview) return;
    try {
      const res = await confirmImport.mutateAsync({
        fileAssetId: preview.fileAssetId,
        columnMappings: Object.entries(mapping).map(([csvHeader, mappedTo]) => ({ csvHeader, mappedTo })),
        targetListId: listMode === "existing" ? targetListId || undefined : undefined,
        newListName: listMode === "new" ? newListName || undefined : undefined,
      });
      setResult(res);
      setStep("done");
      toast({ title: "Import complete", description: `${res.imported} imported, ${res.skipped} skipped.`, variant: "success" });
    } catch (error) {
      toast({ title: "Import failed", description: getErrorMessage(error), variant: "error" });
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink-900">Import recipients</h1>
        <p className="mt-1 text-sm text-ink-500">Upload a CSV file to bulk-add recipients.</p>
      </div>

      <ol className="flex gap-2 text-xs font-medium text-ink-400">
        {(["upload", "map", "review", "done"] as Step[]).map((s, i) => (
          <li key={s} className={cn("flex items-center gap-2", step === s && "text-accent-600")}>
            {i > 0 ? <span className="text-ink-300">/</span> : null}
            <span className="capitalize">{s}</span>
          </li>
        ))}
      </ol>

      {step === "upload" ? (
        <Card>
          <CardBody>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              className={cn(
                "focus-ring flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 text-center transition-colors",
                dragOver ? "border-accent-400 bg-accent-50" : "border-ink-200 hover:border-ink-300",
              )}
            >
              <svg viewBox="0 0 24 24" fill="none" className="mb-3 h-10 w-10 text-ink-300">
                <path
                  d="M12 4v12m0-12l4 4m-4-4l-4 4M5 20h14"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <p className="text-sm font-medium text-ink-700">Drag and drop a CSV file here, or click to browse</p>
              <p className="mt-1 text-xs text-ink-400">Max file size depends on server configuration</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFile(file);
                }}
              />
            </div>
            {importPreview.isPending ? <p className="mt-3 text-center text-sm text-ink-500">Uploading and analyzing file...</p> : null}
          </CardBody>
        </Card>
      ) : null}

      {step === "map" && preview ? (
        <Card>
          <CardHeader title="Map columns" description="Match each CSV column to a recipient field, or leave unmapped to ignore it." />
          <CardBody className="space-y-3">
            {preview.headers.map((header) => (
              <div key={header} className="flex items-center gap-3">
                <span className="w-40 truncate text-sm font-medium text-ink-700">{header}</span>
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-ink-300">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.29 5.16a.75.75 0 111.02-1.1l5.5 5a.75.75 0 010 1.1l-5.5 5a.75.75 0 11-1.02-1.1l4.098-4.09H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
                <Select
                  value={mapping[header] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [header]: e.target.value || null }))}
                  className="max-w-xs"
                >
                  <option value="">Don&apos;t import</option>
                  {KNOWN_RECIPIENT_FIELDS.map((field) => (
                    <option key={field} value={field}>
                      {FIELD_LABELS[field]}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button onClick={goToReview}>Continue</Button>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {step === "review" && preview ? (
        <div className="space-y-6">
          <Card>
            <CardHeader title="Validation summary" />
            <CardBody>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <SummaryStat label="Total rows" value={preview.totalRows} />
                <SummaryStat label="Valid emails" value={preview.validEmails} tone="success" />
                <SummaryStat label="Invalid" value={preview.invalidEmails} tone="danger" />
                <SummaryStat label="Duplicates" value={preview.duplicates} tone="warning" />
              </div>
              {preview.missingEmail > 0 ? (
                <p className="mt-3 text-sm text-amber-700">{preview.missingEmail} row(s) missing an email value.</p>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Sample rows" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-xs font-semibold uppercase text-ink-400">
                    <th className="px-4 py-2">Row</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100">
                  {preview.sampleRows.map((row) => (
                    <tr key={row.rowNumber}>
                      <td className="px-4 py-2 text-ink-500">{row.rowNumber}</td>
                      <td className="px-4 py-2">{row.email ?? "—"}</td>
                      <td className="px-4 py-2">
                        {row.isEmptyRow ? (
                          <Badge tone="neutral">empty</Badge>
                        ) : !row.isValidEmail ? (
                          <Badge tone="danger">invalid</Badge>
                        ) : row.isDuplicateInFile ? (
                          <Badge tone="warning">duplicate</Badge>
                        ) : (
                          <Badge tone="success">valid</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <CardHeader title="Destination list (optional)" />
            <CardBody className="space-y-3">
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={listMode === "none"} onChange={() => setListMode("none")} />
                  No list
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={listMode === "existing"} onChange={() => setListMode("existing")} />
                  Existing list
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={listMode === "new"} onChange={() => setListMode("new")} />
                  New list
                </label>
              </div>
              {listMode === "existing" ? (
                <Select value={targetListId} onChange={(e) => setTargetListId(e.target.value)} className="max-w-xs">
                  <option value="">Select a list</option>
                  {lists?.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </Select>
              ) : null}
              {listMode === "new" ? (
                <div className="max-w-xs">
                  <Label htmlFor="new-list-name">List name</Label>
                  <Input id="new-list-name" value={newListName} onChange={(e) => setNewListName(e.target.value)} />
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setStep("map")}>
              Back
            </Button>
            <Button onClick={handleConfirm} loading={confirmImport.isPending}>
              Confirm import
            </Button>
          </div>
        </div>
      ) : null}

      {step === "done" && result ? (
        <Card>
          <CardBody className="text-center">
            <p className="text-lg font-semibold text-ink-900">Import complete</p>
            <p className="mt-2 text-sm text-ink-600">
              {result.imported} recipient(s) imported, {result.skipped} skipped.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Button variant="outline" onClick={() => router.push("/recipients")}>
                View recipients
              </Button>
              <Button onClick={() => setStep("upload")}>Import another file</Button>
            </div>
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: "success" | "danger" | "warning" }) {
  const toneClass = tone === "success" ? "text-emerald-600" : tone === "danger" ? "text-red-600" : tone === "warning" ? "text-amber-600" : "text-ink-900";
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold", toneClass)}>{value}</p>
    </div>
  );
}
