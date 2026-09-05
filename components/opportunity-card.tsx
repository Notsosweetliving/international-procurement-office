import Link from "next/link";
import type { Opportunity, OpportunitySource } from "@/lib/opportunities/types";
import type { CalculatedMatch } from "@/lib/matching/types";
import {
  formatCurrency,
  formatDate,
  deadlineStatus,
} from "@/lib/opportunities/format";
import { MatchScore } from "./match-score";
import { Icon } from "./icons";
import { SaveOpportunityButton } from "./save-opportunity-button";
const sourceLabel = (source: OpportunitySource | undefined) =>
  source === "UK"
    ? "UK GOV"
    : source === "SAM"
      ? "US FEDERAL"
      : source === "NATO"
        ? "NATO"
        : "EU TED";
export function OpportunityCard({
  opportunity: o,
  calculatedMatch,
  profileExists = true,
  saved,
  workspaceStatus,
}: {
  opportunity: Opportunity;
  calculatedMatch?: CalculatedMatch;
  profileExists?: boolean;
  saved?: boolean;
  workspaceStatus?: { decision: string; readiness: number };
}) {
  const m = calculatedMatch;
  return (
    <article className="opportunity-card">
      <Link href={`/opportunities/${o.id}`} className="card-link">
        <div>
          {m ? (
            <MatchScore score={m.score} />
          ) : o.match ? (
            <MatchScore score={o.match.score} />
          ) : profileExists ? (
            <div className="match-pending">
              <strong>—</strong>
              <span>Match pending</span>
            </div>
          ) : (
            <div className="match-pending setup-score">
              <strong>+</strong>
              <span>Set up profile</span>
            </div>
          )}
        </div>
        <div className="opportunity-body">
          <div className="card-eyebrow">
            <span
              className={`source-badge source-${(o.source ?? "TED").toLowerCase()}`}
            >
              {sourceLabel(o.source)}
            </span>
            <span className="eyebrow buyer-clamp" title={o.buyer.name}>
              {o.buyer.name}
            </span>
          </div>
          <h3 className="title-clamp" title={o.title}>
            {o.title}
          </h3>
          <div className="opportunity-meta">
            <span>{o.country}</span>
            <span>{o.category}</span>
            <span>{formatCurrency(o.value, o.currency)}</span>
            <span>{deadlineStatus(o.deadline).label}</span>
          </div>
          {m ? (
            <div className="match-reasons">
              {m.positiveReasons.slice(0, 2).map((x) => (
                <span key={x}>✓ {x}</span>
              ))}
            </div>
          ) : null}
          <div className="source-line">
            <span>{o.sourceOrganization ?? sourceLabel(o.source)}</span>
            <small>Published {formatDate(o.publishedAt)}</small>
          </div>
          {workspaceStatus ? (
            <div className="workspace-card-status">
              <b>
                {workspaceStatus.decision === "pursue"
                  ? "Pursuing"
                  : workspaceStatus.decision === "review"
                    ? "Review"
                    : workspaceStatus.decision === "do_not_bid"
                      ? "Do not bid"
                      : "Undecided"}
              </b>
              <span>{workspaceStatus.readiness}% ready</span>
            </div>
          ) : null}
        </div>
      </Link>
      <div className="card-actions">
        <SaveOpportunityButton
          opportunityId={o.id}
          initialSaved={saved}
          className="card-save"
        />
        <Link
          href={`/opportunities/${o.id}`}
          className="card-arrow-link"
          aria-label={`Open ${o.title}`}
        >
          <Icon name="arrow" className="card-arrow" />
        </Link>
      </div>
    </article>
  );
}
