import type { ExtractedDocument } from "./types.ts";
export function extractTextDocument(buffer: Buffer): ExtractedDocument {
  const text = buffer
    .toString("utf8")
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .trim();
  return {
    text,
    metadata: {
      format: "text/plain",
      characters: text.length,
      ...(!text
        ? { warning: "Text could not be extracted automatically." }
        : {}),
    },
  };
}
