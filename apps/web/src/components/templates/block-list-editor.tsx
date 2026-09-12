"use client";

import type { EmailBlock } from "@email-platform/types";
import { BLOCK_TYPE_LABELS, createDefaultBlock, moveItem } from "@/lib/block-utils";
import { BlockEditorSwitch, type FocusRegistrar } from "./block-editors";
import { Menu } from "@/components/ui/menu";
import { EmptyState } from "@/components/ui/empty-state";
import { useConfirm } from "@/components/ui/confirm-dialog";

const BLOCK_TYPES: EmailBlock["type"][] = ["heading", "paragraph", "button", "image", "divider", "spacer", "list", "table"];

export function BlockListEditor({
  blocks,
  onChange,
  registerFocusForBlock,
}: {
  blocks: EmailBlock[];
  onChange: (blocks: EmailBlock[]) => void;
  /** Returns a FocusRegistrar bound to the given block id, so the parent can route variable insertion. */
  registerFocusForBlock: (blockId: string) => FocusRegistrar;
}) {
  const confirm = useConfirm();

  function addBlock(type: EmailBlock["type"], atIndex?: number) {
    const block = createDefaultBlock(type);
    const next = [...blocks];
    const insertAt = atIndex ?? next.length;
    next.splice(insertAt, 0, block);
    onChange(next);
  }

  function updateBlock(index: number, block: EmailBlock) {
    const next = [...blocks];
    next[index] = block;
    onChange(next);
  }

  async function removeBlock(index: number) {
    const ok = await confirm({
      title: "Remove block?",
      description: "This block's content will be removed from the template.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveBlock(index: number, direction: -1 | 1) {
    onChange(moveItem(blocks, index, index + direction));
  }

  return (
    <div className="space-y-3">
      {blocks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-200 bg-white">
          <EmptyState
            title="No blocks yet"
            description="Add your first content block to start building this email."
            action={<AddBlockMenu onAdd={(t) => addBlock(t)} />}
          />
        </div>
      ) : (
        blocks.map((block, index) => (
          <div key={block.id} className="rounded-xl border border-ink-100 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {BLOCK_TYPE_LABELS[block.type]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveBlock(index, -1)}
                  disabled={index === 0}
                  className="focus-ring flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                  aria-label="Move block up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveBlock(index, 1)}
                  disabled={index === blocks.length - 1}
                  className="focus-ring flex h-7 w-7 items-center justify-center rounded text-ink-500 hover:bg-ink-100 disabled:opacity-30"
                  aria-label="Move block down"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeBlock(index)}
                  className="focus-ring flex h-7 w-7 items-center justify-center rounded text-red-500 hover:bg-red-50"
                  aria-label="Delete block"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-4">
              <BlockEditorSwitch
                block={block}
                onChange={(b) => updateBlock(index, b)}
                registerFocus={registerFocusForBlock(block.id)}
              />
            </div>
          </div>
        ))
      )}

      {blocks.length > 0 ? (
        <div className="flex justify-center pt-2">
          <AddBlockMenu onAdd={(t) => addBlock(t)} />
        </div>
      ) : null}
    </div>
  );
}

function AddBlockMenu({ onAdd }: { onAdd: (type: EmailBlock["type"]) => void }) {
  return (
    <Menu
      trigger={
        <span className="flex items-center gap-1 px-2 text-sm font-medium text-ink-600">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add block
        </span>
      }
      items={BLOCK_TYPES.map((type) => ({ label: BLOCK_TYPE_LABELS[type], onClick: () => onAdd(type) }))}
    />
  );
}
