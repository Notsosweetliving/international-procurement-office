import { providerBaseUrl } from "./diagnostics.ts";

export const TED_DEFAULT_BASE_URL = "https://api.ted.europa.eu";
export const UK_FTS_DEFAULT_BASE_URL =
  "https://www.find-tender.service.gov.uk/api/1.0";

export function tedBaseUrl(value = process.env.TED_API_BASE_URL) {
  return providerBaseUrl(value, TED_DEFAULT_BASE_URL);
}

export function tedSearchUrl(value = process.env.TED_API_BASE_URL) {
  return new URL("v3/notices/search", `${tedBaseUrl(value)}/`).toString();
}

export function ukFtsBaseUrl(value = process.env.UK_FTS_API_BASE_URL) {
  return providerBaseUrl(value, UK_FTS_DEFAULT_BASE_URL);
}

export function ukFtsUrl(path: string, value = process.env.UK_FTS_API_BASE_URL) {
  return new URL(path.replace(/^\/+/, ""), `${ukFtsBaseUrl(value)}/`).toString();
}

