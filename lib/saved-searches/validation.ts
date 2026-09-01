import { z } from "zod";
export const savedSearchSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    query: z.string().trim().max(500).default(""),
    sources: z
      .array(z.enum(["TED", "UK", "SAM", "NATO"]))
      .max(4)
      .default([]),
    countries: z.array(z.string().trim().min(1).max(100)).max(20).default([]),
    categories: z.array(z.string().trim().min(1).max(120)).max(20).default([]),
    minValue: z.number().nonnegative().nullable().default(null),
    maxValue: z.number().nonnegative().nullable().default(null),
    matchThreshold: z.number().int().min(0).max(100).default(0),
    sorting: z
      .enum(["relevance", "deadline", "value", "match"])
      .default("relevance"),
    alertFrequency: z.enum(["off", "daily", "weekly"]).default("off"),
  })
  .refine(
    (x) =>
      x.minValue === null || x.maxValue === null || x.minValue <= x.maxValue,
    { message: "Minimum value must not exceed maximum value." },
  );
