"use client";
import { useEffect, useState } from "react";
export function SaveOpportunityButton({
  opportunityId,
  initialSaved,
  className = "ghost-button",
}: {
  opportunityId: string;
  initialSaved?: boolean;
  className?: string;
}) {
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [loading, setLoading] = useState(initialSaved === undefined);
  useEffect(() => {
    if (initialSaved !== undefined) return;
    fetch(`/api/saved/${encodeURIComponent(opportunityId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setSaved(data.saved);
      })
      .finally(() => setLoading(false));
  }, [initialSaved, opportunityId]);
  const toggle = async () => {
    if (loading) return;
    setLoading(true);
    const response = await fetch(
      `/api/saved/${encodeURIComponent(opportunityId)}`,
      { method: saved ? "DELETE" : "PUT" },
    );
    if (response.ok) setSaved(!saved);
    setLoading(false);
  };
  return (
    <button
      type="button"
      className={`${className} save-button${saved ? " saved" : ""}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
      disabled={loading}
      aria-pressed={saved}
    >
      {loading ? "…" : saved ? "Saved" : "Save opportunity"}
    </button>
  );
}
