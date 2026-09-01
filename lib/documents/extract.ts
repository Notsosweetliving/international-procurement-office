import type { ExtractedDocument, TenderMimeType } from "./types.ts";
import { extractPdf } from "./pdf.ts";
import { extractDocx } from "./docx.ts";
import { extractTextDocument } from "./text.ts";
export async function extractTenderDocument(
  buffer: Buffer,
  mimeType: TenderMimeType,
): Promise<ExtractedDocument> {
  if (mimeType === "application/pdf") return extractPdf(buffer);
  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  )
    return extractDocx(buffer);
  return extractTextDocument(buffer);
}
export function chunkTenderText(
  text: string,
  maxCharacters = 10000,
  overlap = 500,
) {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (!clean) return [];
  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(clean.length, start + maxCharacters);
    if (end < clean.length) {
      const boundary = clean.lastIndexOf("\n", end);
      if (boundary > start + maxCharacters / 2) end = boundary;
    }
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = Math.max(end - overlap, start + 1);
  }
  return chunks;
}
