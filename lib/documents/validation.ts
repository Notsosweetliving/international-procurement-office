import {
  MAX_TENDER_FILE_SIZE,
  TENDER_MIME_TYPES,
  type DocumentValidation,
  type TenderMimeType,
} from "./types.ts";
const EXTENSIONS: Record<string, TenderMimeType> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};
export function safeFilename(name: string) {
  const base = name.split(/[\\/]/).pop()?.normalize("NFKC") ?? "";
  return base
    .replace(/[^a-zA-Z0-9._ -]/g, "_")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .slice(0, 255);
}
export function detectTenderMime(
  bytes: Uint8Array,
  filename: string,
): TenderMimeType | null {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf" && new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-")
    return "application/pdf";
  if (ext === "docx" && bytes[0] === 0x50 && bytes[1] === 0x4b)
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "txt" && !bytes.slice(0, 512).some((x) => x === 0))
    return "text/plain";
  return null;
}
export function validateTenderFile(
  filename: string,
  size: number,
  declaredMime: string,
  bytes: Uint8Array,
): DocumentValidation {
  const safe = safeFilename(filename);
  if (!safe || safe.length > 255)
    return { ok: false, error: "Invalid filename." };
  if (size < 1) return { ok: false, error: "The document is empty." };
  if (size > MAX_TENDER_FILE_SIZE)
    return { ok: false, error: "Tender documents must be 20MB or smaller." };
  const ext = safe.split(".").pop()?.toLowerCase() ?? "",
    expected = EXTENSIONS[ext];
  if (!expected || !TENDER_MIME_TYPES.includes(expected))
    return {
      ok: false,
      error: "Only PDF, DOCX and TXT documents are supported.",
    };
  const detected = detectTenderMime(bytes, safe);
  if (
    !detected ||
    detected !== expected ||
    (declaredMime && declaredMime !== expected)
  )
    return {
      ok: false,
      error: "The file content, extension and MIME type do not match.",
    };
  return { ok: true, filename: safe, mimeType: detected };
}
export function privateStoragePath(
  userId: string,
  source: string,
  opportunityId: string,
  filename: string,
  documentId: string,
) {
  const segment = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 160);
  return `${userId}/${segment(source)}/${segment(opportunityId)}/${documentId}-${safeFilename(filename)}`;
}
