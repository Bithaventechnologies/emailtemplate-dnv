"use client";

import type { EmailBlock } from "@email-platform/types";
import { cn } from "@/lib/cn";

function resolveVariables(text: string, variables: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

function renderBlock(block: EmailBlock, variables: Record<string, string>) {
  switch (block.type) {
    case "heading": {
      const Tag = block.level;
      const sizeClass = { h1: "text-2xl", h2: "text-xl", h3: "text-lg" }[block.level];
      return (
        <Tag
          key={block.id}
          className={cn("font-semibold text-ink-900", sizeClass)}
          style={{ textAlign: block.align, color: block.color }}
        >
          {resolveVariables(block.text, variables)}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p
          key={block.id}
          style={{ textAlign: block.align, color: block.color }}
          className="text-sm leading-relaxed text-ink-700"
          dangerouslySetInnerHTML={{ __html: resolveVariables(block.html, variables) }}
        />
      );
    case "button":
      return (
        <div key={block.id} style={{ textAlign: block.align }}>
          <a
            href={block.url}
            className="inline-block rounded-md px-5 py-2.5 text-sm font-semibold no-underline"
            style={{ backgroundColor: block.backgroundColor ?? "#111827", color: block.textColor ?? "#ffffff" }}
            onClick={(e) => e.preventDefault()}
          >
            {resolveVariables(block.text, variables)}
          </a>
        </div>
      );
    case "image":
      return (
        <div key={block.id} style={{ textAlign: block.align }}>
          {block.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.alt}
              style={{ width: block.width ? `${block.width}px` : "100%", maxWidth: "100%", display: "inline-block" }}
            />
          ) : (
            <div className="flex h-32 w-full items-center justify-center rounded-md border border-dashed border-ink-300 bg-ink-50 text-xs text-ink-400">
              No image URL set
            </div>
          )}
        </div>
      );
    case "divider":
      return <hr key={block.id} style={{ borderColor: block.color ?? "#e5e7eb" }} />;
    case "spacer":
      return <div key={block.id} style={{ height: `${block.height}px` }} />;
    case "list":
      return block.ordered ? (
        <ol key={block.id} className="list-decimal space-y-1 pl-5 text-sm text-ink-700">
          {block.items.map((item, i) => (
            <li key={i}>{resolveVariables(item, variables)}</li>
          ))}
        </ol>
      ) : (
        <ul key={block.id} className="list-disc space-y-1 pl-5 text-sm text-ink-700">
          {block.items.map((item, i) => (
            <li key={i}>{resolveVariables(item, variables)}</li>
          ))}
        </ul>
      );
    case "table":
      return (
        <table key={block.id} className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i} className="border border-ink-200 bg-ink-50 p-2 text-left font-medium">
                  {resolveVariables(h, variables)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                {row.map((cell, c) => (
                  <td key={c} className="border border-ink-200 p-2">
                    {resolveVariables(cell, variables)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    default:
      return null;
  }
}

export function BlockPreview({
  blocks,
  subject,
  previewText,
  variables = {},
  viewport = "desktop",
}: {
  blocks: EmailBlock[];
  subject?: string;
  previewText?: string;
  variables?: Record<string, string>;
  viewport?: "desktop" | "mobile";
}) {
  return (
    <div className="flex justify-center bg-ink-100 p-4">
      <div
        className={cn(
          "w-full overflow-hidden rounded-lg bg-white shadow-card transition-all",
          viewport === "mobile" ? "max-w-[375px]" : "max-w-[600px]",
        )}
      >
        {subject ? (
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink-900">{resolveVariables(subject, variables)}</p>
            {previewText ? <p className="truncate text-xs text-ink-500">{resolveVariables(previewText, variables)}</p> : null}
          </div>
        ) : null}
        <div className="space-y-4 p-6">
          {blocks.length === 0 ? (
            <p className="text-sm text-ink-400">Add blocks to see a preview.</p>
          ) : (
            blocks.map((block) => renderBlock(block, variables))
          )}
        </div>
      </div>
    </div>
  );
}
