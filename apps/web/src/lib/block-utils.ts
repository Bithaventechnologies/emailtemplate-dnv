import type { EmailBlock } from "@email-platform/types";

let counter = 0;
export function generateBlockId(): string {
  counter += 1;
  return `blk_${Date.now().toString(36)}_${counter}`;
}

export function createDefaultBlock(type: EmailBlock["type"]): EmailBlock {
  const id = generateBlockId();
  switch (type) {
    case "heading":
      return { type: "heading", id, level: "h1", text: "Heading text", align: "left" };
    case "paragraph":
      return { type: "paragraph", id, html: "Write your message here.", align: "left" };
    case "button":
      return { type: "button", id, text: "Click here", url: "https://", align: "center" };
    case "image":
      return { type: "image", id, src: "", alt: "", align: "center" };
    case "divider":
      return { type: "divider", id };
    case "spacer":
      return { type: "spacer", id, height: 16 };
    case "list":
      return { type: "list", id, ordered: false, items: ["First item"] };
    case "table":
      return { type: "table", id, headers: ["Column 1", "Column 2"], rows: [["", ""]] };
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown block type: ${_exhaustive}`);
    }
  }
}

export const BLOCK_TYPE_LABELS: Record<EmailBlock["type"], string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  button: "Button",
  image: "Image",
  divider: "Divider",
  spacer: "Spacer",
  list: "List",
  table: "Table",
};

export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item as T);
  return copy;
}
