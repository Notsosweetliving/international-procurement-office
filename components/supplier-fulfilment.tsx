/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps -- the workspace context is loaded once and refreshed after explicit mutations */
"use client";
import { useEffect, useMemo, useState } from "react";
import type { Opportunity } from "@/lib/opportunities/types";
import type { SupplierRecord, QuoteStatus } from "@/lib/suppliers/types";
import { deriveSourcingNeeds } from "@/lib/suppliers/taxonomy";
import { calculateSupplierFit } from "@/lib/suppliers/matching";
import {
  calculateCostPlan,
  calculateFulfilmentReadiness,
} from "@/lib/suppliers/fulfilment";
type Row = Record<string, unknown>;
type Context = {
  workspace: Row;
  assignments: Row[];
  requirementAssignments: Row[];
  suppliers: (SupplierRecord & { ownerUserId?: string | null })[];
};
const QUOTES = [
  "not_requested",
  "requested",
  "received",
  "declined",
  "expired",
];
export function SupplierFulfilment({
  opportunity,
  requirements,
}: {
  opportunity: Opportunity;
  requirements: Row[];
}) {
  const [context, setContext] = useState<Context | null>(null),
    [message, setMessage] = useState("");
  const refresh = async () => {
    const r = await fetch(`/api/bid-workspaces/${opportunity.id}/suppliers`),
      j = await r.json();
    if (r.ok) setContext(j.supplierContext);
  };
  useEffect(() => {
    void refresh();
  }, []);
  const needs = useMemo(
    () =>
      deriveSourcingNeeds(
        opportunity,
        requirements.map((r) => ({
          id: String(r.id),
          title: String(r.title),
          description: String(r.description),
          mandatory_status: String(r.mandatory_status),
        })),
      ),
    [opportunity, requirements],
  );
  const suppliers = context?.suppliers ?? [];
  const ranked = useMemo(
    () =>
      suppliers
        .map((s) => ({
          supplier: s,
          best: needs
            .map((n) => calculateSupplierFit(s, n))
            .sort((a, b) => b.score - a.score)[0],
        }))
        .sort((a, b) => (b.best?.score ?? 0) - (a.best?.score ?? 0)),
    [suppliers, needs],
  );
  const plan = needs.map((need) => {
    const ra = context?.requirementAssignments.find(
        (x) => x.requirement_id === need.id,
      ),
      assignment = context?.assignments.find(
        (x) => x.id === ra?.workspace_supplier_id,
      ),
      supplier =
        suppliers.find((x) => x.id === assignment?.supplier_id) ?? null;
    return {
      need,
      assignment,
      supplier,
      fit: supplier ? calculateSupplierFit(supplier, need) : null,
    };
  });
  const readiness = calculateFulfilmentReadiness(
    plan.map((x) => ({
      need: x.need,
      supplier: x.supplier,
      supplierFit: x.fit?.score ?? null,
      quoteStatus: String(
        x.assignment?.quote_status ?? "not_requested",
      ) as QuoteStatus,
      quotedAmount:
        x.assignment?.quoted_amount == null
          ? null
          : Number(x.assignment.quoted_amount),
      leadTimeDays:
        x.assignment?.lead_time_days == null
          ? null
          : Number(x.assignment.lead_time_days),
      logisticsCovered: Boolean(x.supplier?.regions.length),
      evidenceComplete: Boolean(
        x.supplier && x.supplier.verificationStatus !== "unverified",
      ),
    })),
  );
  const costs = calculateCostPlan(
    opportunity.value,
    context?.assignments.map((x) => ({
      quotedAmount: x.quoted_amount == null ? null : Number(x.quoted_amount),
      logisticsCost: x.logistics_cost == null ? null : Number(x.logistics_cost),
      otherCost: x.other_cost == null ? null : Number(x.other_cost),
    })) ?? [],
  );
  const assign = async (requirementId: string, supplierId: string) => {
    if (!supplierId) return;
    const r = await fetch(`/api/bid-workspaces/${opportunity.id}/suppliers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ supplierId, requirementId }),
      }),
      j = await r.json();
    setMessage(
      r.ok ? "Supplier assigned as a potential fulfilment partner." : j.error,
    );
    if (r.ok) await refresh();
  };
  const update = async (id: string, body: object) => {
    const r = await fetch(
        `/api/bid-workspaces/${opportunity.id}/suppliers/${id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        },
      ),
      j = await r.json();
    if (!r.ok) setMessage(j.error);
    else await refresh();
  };
  return (
    <div className="supplier-intelligence">
      <div className="fulfilment-summary">
        <Summary
          label="FULFILMENT READINESS"
          value={`${readiness.score}%`}
          detail={`${readiness.covered} / ${readiness.total} sourcing requirements covered`}
        />
        <Summary
          label="SUPPLIER GAPS"
          value={String(readiness.gaps.length)}
          detail="Unassigned sourcing needs"
        />
        <Summary
          label="ASSIGNED SUPPLIERS"
          value={String(context?.assignments.length ?? 0)}
          detail="Workspace-only assignments"
        />
      </div>
      <section>
        <Heading label="SOURCING NEEDS" title="Preliminary fulfilment plan" />
        <div className="fulfilment-table">
          <div className="fulfilment-head">
            <span>Product / service</span>
            <span>Assigned supplier</span>
            <span>Status</span>
            <span>Quote</span>
            <span>Lead time</span>
            <span>Gap</span>
          </div>
          {plan.map((x) => (
            <div className="fulfilment-row" key={x.need.id}>
              <div data-label="Product / service">
                <b>{x.need.description}</b>
                <small>{x.need.capability} · Quantity unknown</small>
              </div>
              <label data-label="Assigned supplier">
                <select
                  value={x.supplier?.id ?? ""}
                  onChange={(e) => assign(x.need.id, e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {suppliers.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <span data-label="Status">
                {String(x.assignment?.status ?? "missing")}
              </span>
              <span data-label="Quote">
                {x.assignment?.quoted_amount
                  ? `${x.assignment.quoted_currency ?? ""} ${Number(x.assignment.quoted_amount).toLocaleString()}`
                  : "Not entered"}
              </span>
              <span data-label="Lead time">
                {x.assignment?.lead_time_days != null
                  ? `${x.assignment.lead_time_days} days`
                  : "Unknown"}
              </span>
              <b data-label="Gap">{x.supplier ? "Covered" : "Missing"}</b>
            </div>
          ))}
        </div>
      </section>
      <section>
        <Heading
          label="RECOMMENDED"
          title="Supplier matches"
          detail="Deterministic fit · decision support only"
        />
        <div className="supplier-recommendations">
          {ranked.slice(0, 6).map((x) => (
            <article key={x.supplier.id}>
              <span>{x.supplier.verificationStatus.replaceAll("_", " ")}</span>
              <h4>{x.supplier.name}</h4>
              <p>
                {x.supplier.country} ·{" "}
                {x.supplier.supplierType.replaceAll("_", " ")}
              </p>
              <strong>{x.best?.score ?? 0}%</strong>
              <b>{x.best?.label}</b>
              <ul>
                {x.best?.reasons.slice(0, 3).map((r) => (
                  <li key={r}>✓ {r}</li>
                ))}
              </ul>
              {x.best?.checks.slice(0, 2).map((r) => (
                <small key={r}>⚠ {r}</small>
              ))}
            </article>
          ))}
          {!ranked.length ? (
            <div className="state-card">
              <b>No private suppliers yet.</b>
              <p>
                Add suppliers from the Suppliers directory to generate
                recommendations.
              </p>
            </div>
          ) : null}
        </div>
      </section>
      <section>
        <Heading label="QUOTE TRACKING" title="Workspace suppliers" />
        <div className="quote-grid">
          {context?.assignments.map((a) => {
            const s = suppliers.find((x) => x.id === a.supplier_id);
            return (
              <form
                key={String(a.id)}
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void update(String(a.id), {
                    quote_status: String(f.get("quote_status")),
                    quoted_amount: num(f, "quoted_amount"),
                    quoted_currency:
                      String(f.get("quoted_currency") || "") || null,
                    lead_time_days: num(f, "lead_time_days"),
                    logistics_cost: num(f, "logistics_cost"),
                    other_cost: num(f, "other_cost"),
                    notes: String(f.get("notes") || "") || null,
                  });
                }}
              >
                <h4>{s?.name ?? "Supplier"}</h4>
                <label>
                  Quote status
                  <select
                    name="quote_status"
                    defaultValue={String(a.quote_status)}
                  >
                    {QUOTES.map((q) => (
                      <option value={q} key={q}>
                        {q.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Quoted amount
                  <input
                    name="quoted_amount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      a.quoted_amount == null ? "" : String(a.quoted_amount)
                    }
                  />
                </label>
                <label>
                  Currency
                  <input
                    name="quoted_currency"
                    maxLength={3}
                    pattern="[A-Z]{3}"
                    defaultValue={String(a.quoted_currency ?? "")}
                  />
                </label>
                <label>
                  Lead time days
                  <input
                    name="lead_time_days"
                    type="number"
                    min="0"
                    max="3650"
                    defaultValue={
                      a.lead_time_days == null ? "" : String(a.lead_time_days)
                    }
                  />
                </label>
                <label>
                  Logistics cost
                  <input
                    name="logistics_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      a.logistics_cost == null ? "" : String(a.logistics_cost)
                    }
                  />
                </label>
                <label>
                  Other cost
                  <input
                    name="other_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={
                      a.other_cost == null ? "" : String(a.other_cost)
                    }
                  />
                </label>
                <label className="wide">
                  Notes
                  <textarea name="notes" defaultValue={String(a.notes ?? "")} />
                </label>
                <button className="black-button">Save quote</button>
              </form>
            );
          })}
        </div>
      </section>
      <section className="cost-planning">
        <span className="section-label">INTERNAL COST PLANNING</span>
        <h3>Planning estimate</h3>
        <p>
          Contract value{" "}
          <b>
            {opportunity.value === null
              ? "Not disclosed"
              : `${opportunity.currency ?? ""} ${opportunity.value.toLocaleString()}`}
          </b>
        </p>
        <p>
          Entered supplier and fulfilment costs{" "}
          <b>{costs.totalEnteredCosts.toLocaleString()}</b>
        </p>
        <p>
          Estimated remaining gross spread{" "}
          <b>
            {costs.remainingSpread === null
              ? "Enter contract value and real costs"
              : costs.remainingSpread.toLocaleString()}
          </b>
        </p>
        <small>
          Planning estimate only. Missing costs are never invented and no profit
          is guaranteed.
        </small>
      </section>
      {message ? <div className="workspace-message">{message}</div> : null}
    </div>
  );
}
const num = (f: FormData, n: string) => (f.get(n) ? Number(f.get(n)) : null);
function Summary({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Heading({
  label,
  title,
  detail,
}: {
  label: string;
  title: string;
  detail?: string;
}) {
  return (
    <div className="supplier-section-heading">
      <div>
        <span className="section-label">{label}</span>
        <h3>{title}</h3>
      </div>
      {detail ? <span>{detail}</span> : null}
    </div>
  );
}
