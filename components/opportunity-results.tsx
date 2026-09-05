"use client";
import { useState } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import { MatchedOpportunityList } from "./matched-opportunity-list";

export function OpportunityResults({ initialItems, total, query, workspaceStatuses }: { initialItems: Opportunity[]; total: number; query: string; workspaceStatuses: Record<string, { decision: string; readiness: number }> }) {
  const [items, setItems] = useState(initialItems), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const loadMore = async () => {
    if (loading || items.length >= total) return;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams(query); params.set("offset", String(items.length)); params.set("limit", "50");
      const response = await fetch(`/api/opportunities?${params}`), body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setItems((current) => [...current, ...body.items.filter((item: Opportunity) => !current.some((existing) => existing.id === item.id))]);
    } catch { setError("More opportunities could not be loaded. Please try again."); }
    finally { setLoading(false); }
  };
  return <><MatchedOpportunityList items={items} workspaceStatuses={workspaceStatuses} />{items.length < total ? <div className="load-more-row"><button type="button" onClick={loadMore} disabled={loading}>{loading ? "Loading…" : "Load more opportunities"}</button></div> : null}{error ? <div className="ai-error" role="status">{error}</div> : null}</>;
}
