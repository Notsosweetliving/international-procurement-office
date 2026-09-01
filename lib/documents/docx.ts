import mammoth from "mammoth";
import type { ExtractedDocument } from "./types.ts";
export async function extractDocx(buffer: Buffer): Promise<ExtractedDocument> {
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value.trim();
  return {
    text,
    metadata: {
      format:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      characters: text.length,
      ...(!text
        ? { warning: "Text could not be extracted automatically." }
        : {}),
    },
  };
}
