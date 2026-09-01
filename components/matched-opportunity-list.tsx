"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { useCompanyProfile } from "./use-company-profile";
import { OpportunityCard } from "./opportunity-card";
export function MatchedOpportunityList({
  items,
  mode = "results",
  workspaceStatuses = {},
}: {
  items: Opportunity[];
  mode?: "results" | "dashboard";
  workspaceStatuses?: Record<string, { decision: string; readiness: number }>;
}) {
  const { profile, ready } = useCompanyProfile();
  const [minScore, setMinScore] = useState(0);
  const [sort, setSort] = useState("best");
  const ranked = useMemo(
    () =>
      items.map((o) => ({
        o,
        m: profile ? calculateOpportunityMatch(profile, o) : undefined,
      })),
    [items, profile],
  );
  const shown = useMemo(() => {
    const list = ranked.filter((x) => (x.m?.score ?? 100) >= minScore);
    if (profile && sort === "best")
      list.sort((a, b) => (b.m?.score ?? 0) - (a.m?.score ?? 0));
    if (sort === "deadline")
      list.sort(
        (a, b) =>
          new Date(a.o.deadline ?? "9999").getTime() -
          new Date(b.o.deadline ?? "9999").getTime(),
      );
    if (sort === "newest")
      list.sort(
        (a, b) =>
          new Date(b.o.publishedAt ?? 0).getTime() -
          new Date(a.o.publishedAt ?? 0).getTime(),
      );
    if (sort === "value")
      list.sort((a, b) => (b.o.value ?? -1) - (a.o.value ?? -1));
    return mode === "dashboard" ? list.slice(0, 6) : list;
  }, [ranked, minScore, sort, mode, profile]);
  if (!ready)
    return <div className="state-card">Preparing opportunity rankings…</div>;
  if (mode === "dashboard" && !profile)
    return (
      <div className="profile-cta">
        <div>
          <span className="section-label">PERSONALISED MATCHING</span>
          <h2>Set up your company profile</h2>
          <p>
            Tell IPO what your company supplies so we can rank opportunities for
            you.
          </p>
        </div>
        <Link className="black-button" href="/company">
          Create company profile
        </Link>
      </div>
    );
  return (
    <>
      {mode === "results" ? (
        <div className="match-controls">
          <label>
            Match score
            <select
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              disabled={!profile}
            >
              <option value="0">Any</option>
              <option value="50">50%+</option>
              <option value="75">75%+</option>
              <option value="90">90%+</option>
            </select>
          </label>
          <label>
            Sort by
            <select
              value={profile ? sort : sort === "best" ? "newest" : sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="best" disabled={!profile}>
                Best match
              </option>
              <option value="deadline">Closing soon</option>
              <option value="newest">Newest</option>
              <option value="value">Highest value</option>
            </select>
          </label>
        </div>
      ) : null}
      <div className="opportunity-list">
        {shown.map(({ o, m }) => (
          <OpportunityCard
            key={o.id}
            opportunity={o}
            calculatedMatch={m}
            profileExists={!!profile}
            workspaceStatus={workspaceStatuses[o.id]}
          />
        ))}
      </div>
    </>
  );
}
