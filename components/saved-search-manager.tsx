"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Row = Record<string, unknown>;
export function SavedSearchManager({
  initial,
  setupRequired,
}: {
  initial: Row[];
  setupRequired: boolean;
}) {
  const router = useRouter(),
    [message, setMessage] = useState("");
  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      sources = f.getAll("sources").map(String);
    const r = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          query: f.get("query"),
          sources,
          countries: [],
          categories: [],
          minValue: null,
          maxValue: null,
          matchThreshold: Number(f.get("matchThreshold")),
          sorting: f.get("sorting"),
          alertFrequency: f.get("alertFrequency"),
        }),
      }),
      j = await r.json();
    setMessage(r.ok ? "Search saved." : j.error);
    if (r.ok) router.refresh();
  }
  async function remove(id: string) {
    await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <>
      <form className="saved-search-form" onSubmit={create}>
        <label>
          Search name
          <input
            name="name"
            required
            placeholder="UK cybersecurity contracts"
          />
        </label>
        <label>
          Keywords
          <input name="query" placeholder="cybersecurity" />
        </label>
        <fieldset>
          <legend>Sources</legend>
          {["TED", "UK", "SAM", "NATO"].map((x) => (
            <label key={x}>
              <input type="checkbox" name="sources" value={x} />
              {x}
            </label>
          ))}
        </fieldset>
        <label>
          Minimum match
          <select name="matchThreshold">
            <option value="0">Any match</option>
            <option value="50">50%+</option>
            <option value="75">75%+</option>
          </select>
        </label>
        <label>
          Sort by
          <select name="sorting">
            <option value="relevance">Relevance</option>
            <option value="deadline">Deadline</option>
            <option value="match">Match</option>
          </select>
        </label>
        <label>
          Alert
          <select name="alertFrequency">
            <option value="off">Off</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </label>
        <button className="black-button" disabled={setupRequired}>
          Save search
        </button>
      </form>
      {message ? <div className="workspace-message">{message}</div> : null}
      <div className="saved-search-list">
        {initial.map((x) => (
          <article key={String(x.id)}>
            <div>
              <h3>{String(x.name)}</h3>
              <p>
                {String(x.query) || "All opportunities"} ·{" "}
                {(x.sources as string[]).join(", ") || "All sources"}
              </p>
            </div>
            <div>
              <a
                className="ghost-button"
                href={`/opportunities?q=${encodeURIComponent(String(x.query))}&source=${(x.sources as string[])[0] ?? ""}`}
              >
                Run now
              </a>
              <button
                className="ghost-button"
                onClick={() => {
                  const name = window.prompt(
                    "Rename saved search",
                    String(x.name),
                  );
                  if (name)
                    fetch(`/api/saved-searches/${x.id}`, {
                      method: "PATCH",
                      headers: { "content-type": "application/json" },
                      body: JSON.stringify({ name }),
                    }).then(() => router.refresh());
                }}
              >
                Rename
              </button>
              <button
                className="ghost-button"
                onClick={() => void remove(String(x.id))}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
