import { PDFParse } from "pdf-parse";
import type { ExtractedDocument } from "./types.ts";
export async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });
  try {
    const result = await parser.getText();
    const text = result.text.trim();
    return {
      text,
      metadata: {
        format: "application/pdf",
        characters: text.length,
        pages: result.total,
        ...(!text
          ? { warning: "Text could not be extracted automatically." }
          : {}),
      },
    };
  } finally {
    await parser.destroy();
  }
}
