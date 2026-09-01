export const CAPABILITY_TAXONOMY: Record<string, string[]> = {
  Software: ["Software"],
  Cybersecurity: ["Cybersecurity", "Software"],
  Networking: ["Networking", "Communications", "IT hardware"],
  "IT & Communications": [
    "IT hardware",
    "Networking",
    "Cybersecurity",
    "Electronics",
    "Communications",
    "Software",
  ],
  Construction: ["Construction"],
  Vehicles: ["Vehicles", "Vehicle Parts"],
  Medical: ["Medical Supplies"],
  Clothing: ["Clothing & Uniforms"],
  Logistics: ["Logistics"],
  Electronics: ["Electronics", "IT hardware"],
  "Professional Services": ["Professional Services"],
  Other: ["Other"],
};
export function capabilitiesForOpportunity(
  category: string,
  cpvCodes: string[] = [],
  naicsCodes: string[] = [],
) {
  const direct = CAPABILITY_TAXONOMY[category] ?? [];
  const prefix = cpvCodes[0]?.slice(0, 2);
  const byCpv =
    prefix === "48"
      ? ["Software"]
      : ["30", "32", "72", "73"].includes(prefix)
        ? [
            "IT hardware",
            "Networking",
            "Cybersecurity",
            "Electronics",
            "Communications",
            "Software",
          ]
        : prefix === "45"
          ? ["Construction"]
          : prefix === "34"
            ? ["Vehicles", "Vehicle Parts"]
            : prefix === "33"
              ? ["Medical Supplies"]
              : prefix === "18"
                ? ["Clothing & Uniforms"]
                : ["60", "63", "64"].includes(prefix)
                  ? ["Logistics"]
                  : prefix === "31"
                    ? ["Electronics"]
                    : prefix === "79"
                      ? ["Professional Services"]
                      : [];
  const naics = naicsCodes[0]?.slice(0, 2);
  const byNaics =
    naics === "51"
      ? ["Software", "Communications"]
      : naics === "54"
        ? ["Professional Services", "Cybersecurity"]
        : naics === "23"
          ? ["Construction"]
          : naics === "33"
            ? ["IT hardware", "Electronics"]
            : ["48", "49"].includes(naics)
              ? ["Logistics"]
              : naics === "62"
                ? ["Medical Supplies"]
                : [];
  return [...new Set([...direct, ...byCpv, ...byNaics])];
}
