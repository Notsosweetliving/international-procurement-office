import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiOpportunityIntelligence } from "@/components/ai-opportunity-intelligence";
import { OpportunityMatchDetail } from "@/components/opportunity-match-detail";
import { SaveOpportunityButton } from "@/components/save-opportunity-button";
import { BidWorkspace } from "@/components/bid-workspace";
import { isAiAvailable } from "@/lib/ai/client";
import {
  formatCurrency,
  formatDate,
  deadlineStatus,
} from "@/lib/opportunities/format";
import { getCachedOpportunity } from "@/lib/opportunities/cache";
import type { Opportunity } from "@/lib/opportunities/types";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getPersistedAnalysis } from "@/lib/repositories/analysis";
import { isSaved } from "@/lib/repositories/saved";
import { getBidWorkspace } from "@/lib/repositories/bid-workspace";
import { getCompanyProfile } from "@/lib/repositories/company";
import { calculateOpportunityMatch } from "@/lib/matching/engine";
export const runtime = "nodejs";
export async function generateMetadata({
  params,
}: PageProps<"/opportunities/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Opportunity ${id}`, description: "Procurement opportunity in IPO." };
}
export default async function Detail({
  params,
}: PageProps<"/opportunities/[id]">) {
  const { id } = await params;
  const auth = await getAuthenticatedUser();
  const o = auth.client ? await getCachedOpportunity(auth.client, id).catch(() => null) : null;
  if (!o) notFound();
  const [saved, persisted, bidWorkspace, profile] =
    auth.client && auth.user
      ? await Promise.all([
          isSaved(auth.client, auth.user.id, o.id),
          getPersistedAnalysis(
            auth.client,
            auth.user.id,
            o.source,
            o.id,
            o.publishedAt,
          ),
          getBidWorkspace(auth.client, auth.user.id, o.id),
          getCompanyProfile(auth.client, auth.user.id),
        ])
      : [false, null, null, null];
  const match = profile ? calculateOpportunityMatch(profile, o) : null;
  const classifications = [
    o.cpvCodes?.length ? `CPV: ${o.cpvCodes.join(", ")}` : "",
    o.naicsCodes?.length ? `NAICS: ${o.naicsCodes.join(", ")}` : "",
    o.pscCodes?.length ? `PSC: ${o.pscCodes.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <div className="page detail-page">
      <div className="breadcrumb">
        <Link href="/opportunities">Opportunities</Link>
        <span>/</span>
        <span>{o.reference}</span>
      </div>
      <header className="detail-header single">
        <div>
          <div className="eyebrow">
            {sourceName(o)} · {o.buyer.name}
          </div>
          <h1>{o.title}</h1>
          <div className="detail-meta">
            {[
              ["COUNTRY", o.country],
              ["ESTIMATED VALUE", formatCurrency(o.value, o.currency)],
              ["PUBLISHED", formatDate(o.publishedAt)],
              [
                "DEADLINE",
                o.deadline ? formatDate(o.deadline) : "Not disclosed",
              ],
              ["CATEGORY", o.category],
            ].map((x) => (
              <span key={x[0]}>
                <small>{x[0]}</small>
                {x[1]}
              </span>
            ))}
          </div>
        </div>
        <SaveOpportunityButton opportunityId={o.id} initialSaved={saved} />
      </header>
      <div className="ai-note">
        <b>Deterministic intelligence</b>
        <span>
          Match Scores use your saved company profile and normalized official
          source data. No generative AI is involved.
        </span>
      </div>
      {persisted ? (
        <div className="persisted-note">
          Analysis available in your private workspace
        </div>
      ) : null}
      <AiOpportunityIntelligence opportunity={o} available={isAiAvailable()} />
      <BidWorkspace
        opportunity={o}
        initial={bidWorkspace}
        matchScore={match?.score ?? null}
      />
      <div className="detail-grid">
        <div>
          <Section n="01" title="Notice overview">
            <p className="lead">{o.summary}</p>
            {classifications ? (
              <p>
                {classifications}
                {o.procedureType ? ` · Procedure type ${o.procedureType}` : ""}
              </p>
            ) : null}
          </Section>
          <OpportunityMatchDetail opportunity={o} />
        </div>
        <aside>
          <Side label="IMPORTANT DATES">
            <div>
              <small>Published</small>
              <b>{formatDate(o.publishedAt)}</b>
            </div>
            <div>
              <small>Submission deadline</small>
              <b>{o.deadline ? formatDate(o.deadline) : "Not disclosed"}</b>
              <small>{deadlineStatus(o.deadline).label}</small>
            </div>
          </Side>
          <Side label="BUYER INFORMATION">
            <h3>{o.buyer.name}</h3>
            <p>
              {o.buyer.type}
              <br />
              {o.buyer.country}
            </p>
          </Side>
          <Side label="ORIGINAL NOTICE" className="original-notice-card">
            <p>
              {sourceName(o)} reference {o.reference}
            </p>
            {o.sourceUrl ? (
              <a
                className="external-button"
                href={o.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open official notice
              </a>
            ) : null}
            <small>Source: {sourceName(o)}</small>
          </Side>
        </aside>
      </div>
    </div>
  );
}
const sourceName = (o: Opportunity) =>
  o.source === "UK"
    ? "UK Government"
    : o.source === "SAM"
      ? "US Federal"
      : o.source === "NATO"
        ? "NATO / NCIA"
        : "TED · European Union";
function Section({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="detail-section">
      <header>
        <span>{n}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}
function Side({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`side-card${className ? ` ${className}` : ""}`}>
      <span className="section-label">{label}</span>
      {children}
    </div>
  );
}
