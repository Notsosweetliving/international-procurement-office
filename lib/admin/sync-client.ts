export const ADMIN_SYNC_PATH = "/api/admin/sync-opportunities";

export function adminSyncUrl(source: string) {
  const params = new URLSearchParams({ source });
  return `${ADMIN_SYNC_PATH}?${params.toString()}`;
}

export async function parseAdminSyncResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return await response.json().catch(() => ({ ok: false, error: "The server returned invalid JSON." }));
  }
  const text = await response.text().catch(() => "");
  const safeText = contentType.includes("text/plain") ? text.trim().slice(0, 200) : "";
  return { ok: false, error: safeText || `Sync failed with HTTP ${response.status}.` };
}
