"use client";
import Link from "next/link";
import type { Opportunity } from "@/lib/opportunities/types";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
import { useCompanyProfile } from "./use-company-profile";
import { MatchScore } from "./match-score";
const LABELS: Record<string, string> = {
  capability: "Capability",
  geography: "Geography",
  value: "Contract value",
  businessModel: "Business model",
  certifications: "Certifications",
  governmentExperience: "Government experience",
  dataCompleteness: "Data completeness",
  deadline: "Deadline practicality",
};
const MAX: Record<string, number> = {
  capability: 30,
  geography: 20,
  value: 15,
  businessModel: 10,
  certifications: 10,
  governmentExperience: 5,
  dataCompleteness: 5,
  deadline: 5,
};
export function OpportunityMatchDetail({
  opportunity: o,
}: {
  opportunity: Opportunity;
}) {
  const { profile, ready } = useCompanyProfile();
  if (!ready) return <div className="state-card">Calculating match…</div>;
  if (!profile)
    return (
      <section className="detail-section">
        <header>
          <span>02</span>
          <h2>IPO Match</h2>
        </header>
        <div className="profile-cta compact">
          <div>
            <h3>Set up your company profile</h3>
            <p>
              Add your capabilities and preferences to calculate a transparent
              Match Score.
            </p>
          </div>
          <Link className="black-button" href="/company">
            Create profile
          </Link>
        </div>
      </section>
    );
  const m = calculateOpportunityMatch(profile, o);
  return (
    <>
      <div className="calculated-hero">
        <MatchScore score={m.score} large />
        <div>
          <b>{m.label}</b>
          <span>{m.confidence}</span>
        </div>
      </div>
      <div className="split">
        <section className="detail-section">
          <header>
            <span>02</span>
            <h2>Why this matches</h2>
          </header>
          <ul className="positive">
            {m.positiveReasons.map((x) => (
              <li key={x}>
                <span>✓</span>
                {x}
              </li>
            ))}
          </ul>
        </section>
        <section className="detail-section">
          <header>
            <span>03</span>
            <h2>Check before bidding</h2>
          </header>
          <ul className="warning">
            {m.warnings.map((x) => (
              <li key={x}>
                <span>!</span>
                {x}
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="detail-section">
        <header>
          <span>04</span>
          <h2>Score breakdown</h2>
        </header>
        <div className="score-breakdown">
          {Object.entries(m.scoreBreakdown).map(([k, v]) => (
            <div key={k}>
              <span>{LABELS[k]}</span>
              <div>
                <i style={{ width: `${(v / MAX[k]) * 100}%` }} />
              </div>
              <b>
                {v} / {MAX[k]}
              </b>
            </div>
          ))}
        </div>
        <p className="match-disclaimer">
          IPO Match Scores are decision-support signals, not legal or
          procurement advice. Always verify official tender requirements.
        </p>
      </section>
    </>
  );
}
