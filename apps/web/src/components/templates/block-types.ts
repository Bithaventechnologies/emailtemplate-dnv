import type {
  headingBlockSchema,
  paragraphBlockSchema,
  buttonBlockSchema,
  imageBlockSchema,
  dividerBlockSchema,
  spacerBlockSchema,
  listBlockSchema,
  tableBlockSchema,
} from "@email-platform/types";
import type { z } from "zod";

export type HeadingBlock = z.infer<typeof headingBlockSchema>;
export type ParagraphBlock = z.infer<typeof paragraphBlockSchema>;
export type ButtonBlock = z.infer<typeof buttonBlockSchema>;
export type ImageBlock = z.infer<typeof imageBlockSchema>;
export type DividerBlock = z.infer<typeof dividerBlockSchema>;
export type SpacerBlock = z.infer<typeof spacerBlockSchema>;
export type ListBlock = z.infer<typeof listBlockSchema>;
export type TableBlock = z.infer<typeof tableBlockSchema>;

export type { EmailBlock, EmailDocument } from "@email-platform/types";
