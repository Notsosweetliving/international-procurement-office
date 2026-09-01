export const TENDER_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
] as const;
export type TenderMimeType = (typeof TENDER_MIME_TYPES)[number];
export type ProcessingStatus = "uploaded" | "processing" | "ready" | "failed";
export interface ExtractedDocument {
  text: string;
  metadata: {
    format: TenderMimeType;
    characters: number;
    pages?: number;
    warning?: string;
  };
}
export type DocumentValidation =
  | { ok: true; filename: string; mimeType: TenderMimeType }
  | { ok: false; error: string };
export const MAX_TENDER_FILE_SIZE = 20 * 1024 * 1024;
