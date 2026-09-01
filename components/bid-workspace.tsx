/* eslint-disable react-hooks/purity, react-hooks/exhaustive-deps -- deadline is snapshotted for one interactive workspace session */
"use client";
import { useMemo, useState } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import { SupplierFulfilment } from "@/components/supplier-fulfilment";
import { calculateBidReadiness } from "@/lib/bid-workspace/readiness";
import type {
  ComplianceStatus,
  RequirementLike,
} from "@/lib/bid-workspace/types";
type Row = Record<string, unknown>;
type WorkspaceData = {
  workspace: Row;
  documents: Row[];
  requirements: Row[];
  compliance: Row[];
  checklist: Row[];
};
const TABS = [
  "Overview",
  "Documents",
  "Requirements",
  "Compliance",
  "Risks",
  "Submission checklist",
  "Fulfilment",
  "Bid / No-bid",
] as const;
const statusLabel = (value: string) =>
  value
    .split("_")
    .map((x) => x[0]?.toUpperCase() + x.slice(1))
    .join(" ");
export function BidWorkspace({
  opportunity,
  initial,
  matchScore,
}: {
  opportunity: Opportunity;
  initial: WorkspaceData | null;
  matchScore: number | null;
}) {
  const [data, setData] = useState(initial),
    [tab, setTab] = useState<(typeof TABS)[number]>("Overview"),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const requirements = data?.requirements ?? [],
    documents = data?.documents ?? [],
    compliance = data?.compliance ?? [],
    checklist = data?.checklist ?? [];
  const daysRemaining = opportunity.deadline
    ? Math.ceil(
        (new Date(opportunity.deadline).getTime() - Date.now()) / 86400000,
      )
    : null;
  const readiness = useMemo(
    () =>
      calculateBidReadiness({
        items: requirements.map((r) => {
          const c = compliance.find((x) => x.requirement_id === r.id);
          return {
            requirement: {
              title: String(r.title),
              description: String(r.description),
              requirementType: String(r.requirement_type),
              mandatoryStatus: String(r.mandatory_status),
              confidence: String(r.confidence),
            } as RequirementLike,
            status: String(c?.status ?? "needs_review") as ComplianceStatus,
            evidenceAvailable: Boolean(c?.evidence_document_id),
          };
        }),
        submissionCompleted: checklist.filter((x) => x.completed).length,
        submissionTotal: checklist.length,
        daysRemaining,
      }),
    [requirements, compliance, checklist, daysRemaining],
  );
  const refresh = async () => {
    const r = await fetch(`/api/bid-workspaces/${opportunity.id}`),
      j = await r.json();
    if (r.ok) setData(j.bidWorkspace);
  };
  const start = async () => {
    setBusy(true);
    setMessage("");
    try {
      const r = await fetch(`/api/bid-workspaces/${opportunity.id}`, {
          method: "POST",
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setData(j.bidWorkspace);
      setMessage("Bid workspace created and opportunity saved.");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Workspace could not be created.",
      );
    } finally {
      setBusy(false);
    }
  };
  const upload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget,
      file = new FormData(form).get("file");
    if (!(file instanceof File) || !file.size) return;
    setBusy(true);
    setMessage("Uploading and extracting document…");
    try {
      const body = new FormData();
      body.set("file", file);
      const r = await fetch(`/api/bid-workspaces/${opportunity.id}/documents`, {
          method: "POST",
          body,
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      await refresh();
      form.reset();
      setMessage(j.warning ?? "Document processed and requirements updated.");
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Document processing failed.",
      );
    } finally {
      setBusy(false);
    }
  };
  const patchCompliance = async (itemId: string, body: object) => {
    await fetch(`/api/bid-workspaces/${opportunity.id}/compliance/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    await refresh();
  };
  const patchChecklist = async (itemId: string, completed: boolean) => {
    await fetch(`/api/bid-workspaces/${opportunity.id}/checklist/${itemId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    await refresh();
  };
  const decision = async (value: string) => {
    await fetch(`/api/bid-workspaces/${opportunity.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ decision: value }),
    });
    await refresh();
  };
  return (
    <section className="bid-workspace" id="bid-workspace">
      <header className="workspace-heading">
        <div>
          <span className="section-label">
            ACTIONABLE PROCUREMENT WORKSPACE
          </span>
          <h2>Bid workspace</h2>
          <p>
            Documents, requirements, evidence and your bid decision in one
            private workspace.
          </p>
        </div>
        {data ? (
          <div className="readiness-orb">
            <strong>{readiness.score}%</strong>
            <span>ready</span>
          </div>
        ) : null}
      </header>
      {!data ? (
        <div className="workspace-start">
          <div>
            <b>Turn this opportunity into an active bid workspace.</b>
            <p>
              Starting automatically saves the opportunity. Your decision
              remains yours.
            </p>
          </div>
          <button className="black-button" onClick={start} disabled={busy}>
            {busy ? "Starting…" : "Start bid workspace"}
          </button>
        </div>
      ) : (
        <>
          <nav className="workspace-tabs" aria-label="Bid workspace sections">
            {TABS.map((x) => (
              <button
                key={x}
                className={tab === x ? "active" : ""}
                onClick={() => setTab(x)}
              >
                {x}
              </button>
            ))}
          </nav>
          {tab === "Overview" ? (
            <div className="workspace-overview">
              <div className="decision-metrics">
                <Metric
                  label="MATCH"
                  value={matchScore === null ? "—" : `${matchScore}%`}
                />
                <Metric label="READINESS" value={`${readiness.score}%`} />
                <Metric
                  label="DEADLINE"
                  value={
                    daysRemaining === null
                      ? "Unknown"
                      : daysRemaining < 0
                        ? "Closed"
                        : `${daysRemaining} days`
                  }
                />
                <Metric
                  label="BLOCKERS"
                  value={String(readiness.blockers.length)}
                />
              </div>
              <div className="readiness-breakdown">
                {Object.entries(readiness.breakdown).map(([k, v]) => (
                  <div key={k}>
                    <span>{statusLabel(k)}</span>
                    <b>{v} pts</b>
                  </div>
                ))}
              </div>
              <p>
                {readiness.addressedCount} / {readiness.totalRequirements}{" "}
                requirements addressed. Bid Readiness is deterministic and
                separate from Match Score.
              </p>
            </div>
          ) : null}
          {tab === "Documents" ? (
            <div className="workspace-panel">
              <form className="document-upload" onSubmit={upload}>
                <input
                  aria-label="Tender document"
                  name="file"
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  required
                />
                <button className="black-button" disabled={busy}>
                  {busy ? "Processing…" : "Upload document"}
                </button>
                <small>PDF, DOCX or TXT · 20MB maximum · private storage</small>
              </form>
              <div className="document-list">
                {documents.length ? (
                  documents.map((d) => (
                    <div key={String(d.id)}>
                      <div>
                        <b>{String(d.filename)}</b>
                        <small>
                          {Math.ceil(Number(d.file_size) / 1024)} KB ·{" "}
                          {statusLabel(String(d.processing_status))}
                        </small>
                        {d.processing_error ? (
                          <small>{String(d.processing_error)}</small>
                        ) : null}
                      </div>
                      <button
                        onClick={async () => {
                          const r = await fetch(
                              `/api/bid-workspaces/${opportunity.id}/documents/${d.id}`,
                            ),
                            j = await r.json();
                          if (r.ok)
                            window.open(j.url, "_blank", "noopener,noreferrer");
                        }}
                      >
                        Open
                      </button>
                    </div>
                  ))
                ) : (
                  <Empty text="No tender documents uploaded." />
                )}
              </div>
            </div>
          ) : null}
          {tab === "Requirements" ? (
            <div className="workspace-panel requirement-list">
              {requirements.length ? (
                requirements.map((r) => (
                  <article key={String(r.id)}>
                    <div>
                      <span>{statusLabel(String(r.requirement_type))}</span>
                      <b>{String(r.title)}</b>
                    </div>
                    <p>{String(r.description)}</p>
                    <small>
                      {statusLabel(String(r.mandatory_status))} ·{" "}
                      {String(r.confidence)} confidence ·{" "}
                      {String(r.source_reference ?? "Found in extracted text")}
                    </small>
                  </article>
                ))
              ) : (
                <Empty text="Upload a tender document to extract structured requirements." />
              )}
            </div>
          ) : null}
          {tab === "Compliance" ? (
            <div className="compliance-matrix">
              <div className="compliance-head">
                <span>Requirement</span>
                <span>Type</span>
                <span>Mandatory?</span>
                <span>Company status</span>
                <span>Evidence</span>
                <span>Source</span>
              </div>
              {requirements.map((r) => {
                const c = compliance.find((x) => x.requirement_id === r.id);
                return (
                  <div className="compliance-row" key={String(r.id)}>
                    <div data-label="Requirement">
                      <b>{String(r.title)}</b>
                      <small>{String(r.description)}</small>
                    </div>
                    <span data-label="Type">
                      {statusLabel(String(r.requirement_type))}
                    </span>
                    <span data-label="Mandatory?">
                      {statusLabel(String(r.mandatory_status))}
                    </span>
                    <label data-label="Company status">
                      <span className="sr-only">Company status</span>
                      <select
                        value={String(c?.status ?? "needs_review")}
                        onChange={(e) =>
                          c &&
                          patchCompliance(String(c.id), {
                            status: e.target.value,
                          })
                        }
                      >
                        {[
                          "meets",
                          "likely_meets",
                          "needs_evidence",
                          "missing",
                          "needs_review",
                          "not_applicable",
                        ].map((x) => (
                          <option key={x} value={x}>
                            {statusLabel(x)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label data-label="Evidence">
                      <span className="sr-only">Evidence document</span>
                      <select
                        value={String(c?.evidence_document_id ?? "")}
                        onChange={(e) =>
                          c &&
                          patchCompliance(String(c.id), {
                            evidence_document_id: e.target.value || null,
                          })
                        }
                      >
                        <option value="">Evidence required</option>
                        {documents.map((d) => (
                          <option key={String(d.id)} value={String(d.id)}>
                            {String(d.filename)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <small data-label="Source">
                      {String(r.source_reference ?? "Found in extracted text")}
                    </small>
                  </div>
                );
              })}
              {!requirements.length ? (
                <Empty text="No compliance items yet." />
              ) : null}
            </div>
          ) : null}
          {tab === "Risks" ? (
            <div className="workspace-panel blocker-list">
              <h3>{readiness.blockers.length} potential blockers</h3>
              {readiness.blockers.length ? (
                readiness.blockers.map((x, i) => (
                  <div key={i}>
                    <b>{x.requirement.title}</b>
                    <p>
                      {x.status === "missing"
                        ? "Profile information suggests this requirement may be missing."
                        : "Tender-specific evidence or review is still required."}
                    </p>
                  </div>
                ))
              ) : (
                <Empty text="No deterministic mandatory blockers identified." />
              )}
              <small>
                Decision support only. IPO does not determine contractual
                compliance.
              </small>
            </div>
          ) : null}
          {tab === "Submission checklist" ? (
            <div className="workspace-panel checklist">
              {checklist.length ? (
                checklist.map((x) => (
                  <label key={String(x.id)}>
                    <input
                      type="checkbox"
                      checked={Boolean(x.completed)}
                      onChange={(e) =>
                        patchChecklist(String(x.id), e.target.checked)
                      }
                    />
                    <span>
                      <b>{String(x.label)}</b>
                      <small>{statusLabel(String(x.category))}</small>
                    </span>
                  </label>
                ))
              ) : (
                <Empty text="Submission items appear here after requirement extraction." />
              )}
            </div>
          ) : null}
          {tab === "Fulfilment" ? (
            <SupplierFulfilment
              opportunity={opportunity}
              requirements={requirements}
            />
          ) : null}
          {tab === "Bid / No-bid" ? (
            <div className="workspace-panel decision-panel">
              <div className="decision-metrics">
                <Metric
                  label="MATCH"
                  value={matchScore === null ? "—" : `${matchScore}%`}
                />
                <Metric label="READINESS" value={`${readiness.score}%`} />
                <Metric
                  label="DEADLINE"
                  value={
                    daysRemaining === null ? "Unknown" : `${daysRemaining} days`
                  }
                />
                <Metric
                  label="BLOCKERS"
                  value={String(readiness.blockers.length)}
                />
              </div>
              <h3>Recorded decision</h3>
              <div className="decision-buttons">
                {[
                  ["undecided", "Undecided"],
                  ["pursue", "Pursue"],
                  ["review", "Review"],
                  ["do_not_bid", "Do not bid"],
                ].map(([v, l]) => (
                  <button
                    key={v}
                    className={data.workspace.decision === v ? "active" : ""}
                    onClick={() => decision(v)}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <div className="ai-note">
                <b>AI decision support</b>
                <span>
                  {readiness.blockers.length
                    ? "Recommended review: resolve mandatory blockers before pursuing."
                    : "No deterministic blocker is currently identified. Verify all official requirements."}
                </span>
              </div>
              <p>
                The final business and legal decision is always selected by you.
              </p>
            </div>
          ) : null}
        </>
      )}
      {message ? (
        <div className="workspace-message" role="status">
          {message}
        </div>
      ) : null}
    </section>
  );
}
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="state-card">
      <p>{text}</p>
    </div>
  );
}
export default BidWorkspace;
