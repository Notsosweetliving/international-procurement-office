"use client";
import { useState } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import type { ProcurementSearchIntent } from "@/lib/ai/schemas";
import { useCompanyProfile } from "./use-company-profile";
import { MatchedOpportunityList } from "./matched-opportunity-list";
import { Icon } from "./icons";
export function DashboardAiSearch({ available }: { available: boolean }) {
  const { profile } = useCompanyProfile();
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Opportunity[] | null>(null);
  const [intent, setIntent] = useState<ProcurementSearchIntent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!available || loading || query.trim().length < 2) return;
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query, companyProfile: profile }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error);
      setItems(data.items);
      setIntent(data.intent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <section className="ask-panel">
        <span className="section-label">
          NATURAL-LANGUAGE PROCUREMENT SEARCH
        </span>
        <form className="ai-search" onSubmit={submit}>
          <Icon name="sparkle" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value.slice(0, 500))}
            placeholder={
              available
                ? "Find software contracts under €2M closing in 30 days"
                : "AI search unavailable — add OPENAI_API_KEY"
            }
          />
          <button disabled={!available || loading}>
            <span>{loading ? "Searching…" : "Ask"}</span>
            <Icon name="arrow" />
          </button>
        </form>
        <div className="prompt-row">
          <span>Try asking</span>
          {[
            "Find cybersecurity contracts in Europe",
            "Show IT contracts between €500k and €5m",
            "Government software contracts closing this month",
          ].map((x) => (
            <button key={x} onClick={() => setQuery(x)}>
              {x}
            </button>
          ))}
        </div>
      </section>
      {error ? <div className="ai-error">{error}</div> : null}
      {items ? (
        <section className="ai-search-results">
          <div className="section-heading">
            <div>
              <span className="section-label">INTERPRETED SEARCH</span>
              <h2>{items.length} opportunities found</h2>
            </div>
            <span>
              {intent?.keywords?.join(", ") || "Structured TED search"}
            </span>
          </div>
          <MatchedOpportunityList items={items} />
        </section>
      ) : null}
    </>
  );
}
