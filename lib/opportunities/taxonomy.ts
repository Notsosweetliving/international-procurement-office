const KEYWORDS: Record<string, string[]> = {
  "IT & Communications": [
    "computer",
    "hardware",
    "laptop",
    "server",
    "data centre",
  ],
  Software: ["software", "saas", "application", "license"],
  Cybersecurity: ["cyber", "security", "siem", "zero trust"],
  Networking: ["network", "wireless", "telecom", "connectivity"],
  Construction: ["construction", "building", "works"],
  Vehicles: ["vehicle", "automotive", "truck"],
  Medical: ["medical", "health", "clinical"],
  Logistics: ["logistics", "transport", "freight"],
  "Professional Services": ["consulting", "professional services", "research"],
};
export function categoryFromText(...values: (string | undefined)[]) {
  const corpus = values.join(" ").toLowerCase();
  for (const [category, words] of Object.entries(KEYWORDS))
    if (words.some((word) => corpus.includes(word))) return category;
  return "Other";
}
export function categoryFromNaics(code: string | undefined, title = "") {
  if (code?.startsWith("51")) return "Software";
  if (code?.startsWith("54"))
    return title.toLowerCase().includes("cyber")
      ? "Cybersecurity"
      : "Professional Services";
  if (code?.startsWith("23")) return "Construction";
  if (code?.startsWith("33")) return "IT & Communications";
  if (code?.startsWith("62")) return "Medical";
  if (code?.startsWith("48") || code?.startsWith("49")) return "Logistics";
  return categoryFromText(title);
}
