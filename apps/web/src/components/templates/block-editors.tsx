"use client";

import { useRef } from "react";
import type {
  EmailBlock,
  HeadingBlock,
  ParagraphBlock,
  ButtonBlock,
  ImageBlock,
  SpacerBlock,
  ListBlock,
  TableBlock,
  DividerBlock,
} from "./block-types";
import { Input, Select, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Every editor registers its currently-focused text input so the variable
// sidebar can insert a {{token}} at the last cursor position on click.
export type FocusRegistrar = (setter: (token: string) => void) => void;

function useFocusableRef<T extends HTMLInputElement | HTMLTextAreaElement>(registerFocus: FocusRegistrar, onChange: (value: string) => void) {
  const ref = useRef<T>(null);

  function bind() {
    registerFocus((token: string) => {
      const el = ref.current;
      if (!el) return;
      const start = el.selectionStart ?? el.value.length;
      const end = el.selectionEnd ?? el.value.length;
      const next = el.value.slice(0, start) + token + el.value.slice(end);
      onChange(next);
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(start + token.length, start + token.length);
      });
    });
  }

  return { ref, bind };
}

export function HeadingBlockEditor({
  block,
  onChange,
  registerFocus,
}: {
  block: HeadingBlock;
  onChange: (block: HeadingBlock) => void;
  registerFocus: FocusRegistrar;
}) {
  const { ref, bind } = useFocusableRef<HTMLInputElement>(registerFocus, (text) => onChange({ ...block, text }));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[100px_1fr_120px]">
      <div>
        <Label htmlFor={`${block.id}-level`}>Level</Label>
        <Select id={`${block.id}-level`} value={block.level} onChange={(e) => onChange({ ...block, level: e.target.value as HeadingBlock["level"] })}>
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
        </Select>
      </div>
      <div>
        <Label htmlFor={`${block.id}-text`}>Text</Label>
        <Input
          id={`${block.id}-text`}
          ref={ref}
          value={block.text}
          onFocus={bind}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor={`${block.id}-align`}>Align</Label>
        <Select id={`${block.id}-align`} value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value as HeadingBlock["align"] })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </div>
    </div>
  );
}

const TOOLBAR_ACTIONS: Array<{ tag: string; label: string; wrap: (text: string) => string }> = [
  { tag: "b", label: "B", wrap: (t) => `<b>${t || "bold text"}</b>` },
  { tag: "i", label: "I", wrap: (t) => `<i>${t || "italic text"}</i>` },
  { tag: "u", label: "U", wrap: (t) => `<u>${t || "underlined text"}</u>` },
];

export function ParagraphBlockEditor({
  block,
  onChange,
  registerFocus,
}: {
  block: ParagraphBlock;
  onChange: (block: ParagraphBlock) => void;
  registerFocus: FocusRegistrar;
}) {
  const { ref, bind } = useFocusableRef<HTMLTextAreaElement>(registerFocus, (html) => onChange({ ...block, html }));

  function insertAtCursor(text: string) {
    const el = ref.current;
    if (!el) {
      onChange({ ...block, html: block.html + text });
      return;
    }
    const start = el.selectionStart ?? block.html.length;
    const end = el.selectionEnd ?? block.html.length;
    const selected = block.html.slice(start, end);
    const replacement = text.includes("</") ? text.replace(/>[^<]*</, `>${selected || undefined}<`) : text;
    const next = block.html.slice(0, start) + replacement + block.html.slice(end);
    onChange({ ...block, html: next });
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <Label htmlFor={`${block.id}-html`}>Content (HTML)</Label>
        <div className="flex gap-1">
          {TOOLBAR_ACTIONS.map((action) => (
            <button
              key={action.tag}
              type="button"
              onClick={() => {
                const el = ref.current;
                const selected = el ? block.html.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0) : "";
                insertAtCursor(action.wrap(selected));
              }}
              className="focus-ring flex h-7 w-7 items-center justify-center rounded border border-ink-200 text-xs font-semibold text-ink-600 hover:bg-ink-100"
              aria-label={`Toggle ${action.label}`}
            >
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              const el = ref.current;
              const selected = el ? block.html.slice(el.selectionStart ?? 0, el.selectionEnd ?? 0) : "";
              insertAtCursor(`<a href="https://">${selected || "link text"}</a>`);
            }}
            className="focus-ring flex h-7 items-center justify-center rounded border border-ink-200 px-2 text-xs font-semibold text-ink-600 hover:bg-ink-100"
            aria-label="Insert link"
          >
            Link
          </button>
        </div>
      </div>
      <textarea
        id={`${block.id}-html`}
        ref={ref}
        value={block.html}
        onFocus={bind}
        onChange={(e) => onChange({ ...block, html: e.target.value })}
        rows={4}
        className="focus-ring w-full rounded-md border border-ink-200 bg-white px-3 py-2 font-mono text-sm text-ink-900"
      />
      <div className="mt-2 grid grid-cols-2 gap-3 sm:w-1/2">
        <div>
          <Label htmlFor={`${block.id}-align`}>Align</Label>
          <Select id={`${block.id}-align`} value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value as ParagraphBlock["align"] })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </div>
      </div>
    </div>
  );
}

export function ButtonBlockEditor({
  block,
  onChange,
  registerFocus,
}: {
  block: ButtonBlock;
  onChange: (block: ButtonBlock) => void;
  registerFocus: FocusRegistrar;
}) {
  const text = useFocusableRef<HTMLInputElement>(registerFocus, (v) => onChange({ ...block, text: v }));
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        <Label htmlFor={`${block.id}-text`}>Button text</Label>
        <Input id={`${block.id}-text`} ref={text.ref} value={block.text} onFocus={text.bind} onChange={(e) => onChange({ ...block, text: e.target.value })} />
      </div>
      <div>
        <Label htmlFor={`${block.id}-url`}>URL</Label>
        <Input id={`${block.id}-url`} value={block.url} onChange={(e) => onChange({ ...block, url: e.target.value })} placeholder="https://" />
      </div>
      <div>
        <Label htmlFor={`${block.id}-align`}>Align</Label>
        <Select id={`${block.id}-align`} value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value as ButtonBlock["align"] })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </div>
      <div className="flex gap-3">
        <div className="flex-1">
          <Label htmlFor={`${block.id}-bg`}>Background</Label>
          <Input id={`${block.id}-bg`} type="color" value={block.backgroundColor ?? "#111827"} onChange={(e) => onChange({ ...block, backgroundColor: e.target.value })} className="h-9 p-1" />
        </div>
        <div className="flex-1">
          <Label htmlFor={`${block.id}-fg`}>Text color</Label>
          <Input id={`${block.id}-fg`} type="color" value={block.textColor ?? "#ffffff"} onChange={(e) => onChange({ ...block, textColor: e.target.value })} className="h-9 p-1" />
        </div>
      </div>
    </div>
  );
}

export function ImageBlockEditor({ block, onChange }: { block: ImageBlock; onChange: (block: ImageBlock) => void }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${block.id}-src`}>Image URL</Label>
        <Input id={`${block.id}-src`} value={block.src} onChange={(e) => onChange({ ...block, src: e.target.value })} placeholder="https://" />
      </div>
      <div>
        <Label htmlFor={`${block.id}-alt`}>Alt text</Label>
        <Input id={`${block.id}-alt`} value={block.alt} onChange={(e) => onChange({ ...block, alt: e.target.value })} />
      </div>
      <div>
        <Label htmlFor={`${block.id}-href`}>Link (optional)</Label>
        <Input id={`${block.id}-href`} value={block.href ?? ""} onChange={(e) => onChange({ ...block, href: e.target.value || undefined })} placeholder="https://" />
      </div>
      <div>
        <Label htmlFor={`${block.id}-width`}>Width (px)</Label>
        <Input id={`${block.id}-width`} type="number" value={block.width ?? ""} onChange={(e) => onChange({ ...block, width: e.target.value ? Number(e.target.value) : undefined })} />
      </div>
      <div>
        <Label htmlFor={`${block.id}-align`}>Align</Label>
        <Select id={`${block.id}-align`} value={block.align} onChange={(e) => onChange({ ...block, align: e.target.value as ImageBlock["align"] })}>
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </div>
    </div>
  );
}

export function DividerBlockEditor({ block, onChange }: { block: DividerBlock; onChange: (block: DividerBlock) => void }) {
  return (
    <div className="sm:w-1/3">
      <Label htmlFor={`${block.id}-color`}>Color</Label>
      <Input id={`${block.id}-color`} type="color" value={block.color ?? "#e5e7eb"} onChange={(e) => onChange({ ...block, color: e.target.value })} className="h-9 p-1" />
    </div>
  );
}

export function SpacerBlockEditor({ block, onChange }: { block: SpacerBlock; onChange: (block: SpacerBlock) => void }) {
  return (
    <div className="sm:w-1/3">
      <Label htmlFor={`${block.id}-height`}>Height (px)</Label>
      <Input
        id={`${block.id}-height`}
        type="number"
        min={4}
        max={120}
        value={block.height}
        onChange={(e) => onChange({ ...block, height: Number(e.target.value) })}
      />
    </div>
  );
}

export function ListBlockEditor({ block, onChange }: { block: ListBlock; onChange: (block: ListBlock) => void }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Label htmlFor={`${block.id}-ordered`}>Style</Label>
        <Select
          id={`${block.id}-ordered`}
          value={block.ordered ? "ordered" : "unordered"}
          onChange={(e) => onChange({ ...block, ordered: e.target.value === "ordered" })}
          className="w-40"
        >
          <option value="unordered">Bulleted</option>
          <option value="ordered">Numbered</option>
        </Select>
      </div>
      <div className="space-y-2">
        {block.items.map((item, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              value={item}
              onChange={(e) => {
                const items = [...block.items];
                items[idx] = e.target.value;
                onChange({ ...block, items });
              }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove item"
              onClick={() => onChange({ ...block, items: block.items.filter((_, i) => i !== idx) })}
              disabled={block.items.length <= 1}
            >
              ✕
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onChange({ ...block, items: [...block.items, ""] })}>
        Add item
      </Button>
    </div>
  );
}

export function TableBlockEditor({ block, onChange }: { block: TableBlock; onChange: (block: TableBlock) => void }) {
  function updateHeader(idx: number, value: string) {
    const headers = [...block.headers];
    headers[idx] = value;
    onChange({ ...block, headers });
  }
  function updateCell(rowIdx: number, colIdx: number, value: string) {
    const rows = block.rows.map((row) => [...row]);
    const row = rows[rowIdx];
    if (row) row[colIdx] = value;
    onChange({ ...block, rows });
  }
  function addColumn() {
    onChange({ ...block, headers: [...block.headers, `Column ${block.headers.length + 1}`], rows: block.rows.map((r) => [...r, ""]) });
  }
  function addRow() {
    onChange({ ...block, rows: [...block.rows, block.headers.map(() => "")] });
  }
  function removeColumn(idx: number) {
    onChange({
      ...block,
      headers: block.headers.filter((_, i) => i !== idx),
      rows: block.rows.map((r) => r.filter((_, i) => i !== idx)),
    });
  }
  function removeRow(idx: number) {
    onChange({ ...block, rows: block.rows.filter((_, i) => i !== idx) });
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {block.headers.map((h, idx) => (
              <th key={idx} className="border border-ink-200 p-1">
                <div className="flex items-center gap-1">
                  <Input value={h} onChange={(e) => updateHeader(idx, e.target.value)} className="h-8" />
                  <button type="button" onClick={() => removeColumn(idx)} className="focus-ring text-ink-400 hover:text-red-500" aria-label="Remove column" disabled={block.headers.length <= 1}>
                    ✕
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {block.rows.map((row, rowIdx) => (
            <tr key={rowIdx}>
              {row.map((cell, colIdx) => (
                <td key={colIdx} className="border border-ink-200 p-1">
                  <Input value={cell} onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)} className="h-8" />
                </td>
              ))}
              <td>
                <button type="button" onClick={() => removeRow(rowIdx)} className="focus-ring px-1 text-ink-400 hover:text-red-500" aria-label="Remove row" disabled={block.rows.length <= 1}>
                  ✕
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex gap-2">
        <Button type="button" variant="outline" size="sm" onClick={addColumn}>
          Add column
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={addRow}>
          Add row
        </Button>
      </div>
    </div>
  );
}

export function BlockEditorSwitch({
  block,
  onChange,
  registerFocus,
}: {
  block: EmailBlock;
  onChange: (block: EmailBlock) => void;
  registerFocus: FocusRegistrar;
}) {
  switch (block.type) {
    case "heading":
      return <HeadingBlockEditor block={block} onChange={onChange as (b: HeadingBlock) => void} registerFocus={registerFocus} />;
    case "paragraph":
      return <ParagraphBlockEditor block={block} onChange={onChange as (b: ParagraphBlock) => void} registerFocus={registerFocus} />;
    case "button":
      return <ButtonBlockEditor block={block} onChange={onChange as (b: ButtonBlock) => void} registerFocus={registerFocus} />;
    case "image":
      return <ImageBlockEditor block={block} onChange={onChange as (b: ImageBlock) => void} />;
    case "divider":
      return <DividerBlockEditor block={block} onChange={onChange as (b: DividerBlock) => void} />;
    case "spacer":
      return <SpacerBlockEditor block={block} onChange={onChange as (b: SpacerBlock) => void} />;
    case "list":
      return <ListBlockEditor block={block} onChange={onChange as (b: ListBlock) => void} />;
    case "table":
      return <TableBlockEditor block={block} onChange={onChange as (b: TableBlock) => void} />;
    default:
      return null;
  }
}
