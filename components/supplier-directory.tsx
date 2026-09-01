"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupplierRecord } from "@/lib/suppliers/types";
const TYPES = [
  ["manufacturer", "Manufacturer"],
  ["distributor", "Distributor"],
  ["reseller", "Reseller"],
  ["systems_integrator", "Systems Integrator"],
  ["service_provider", "Service Provider"],
  ["logistics_provider", "Logistics Provider"],
  ["subcontractor", "Subcontractor"],
];
const split = (v: string) =>
  v
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
export function SupplierDirectory({
  initialSuppliers,
  setupRequired = false,
}: {
  initialSuppliers: (SupplierRecord & { ownerUserId?: string | null })[];
  setupRequired?: boolean;
}) {
  const router = useRouter(),
    [query, setQuery] = useState(""),
    [country, setCountry] = useState(""),
    [type, setType] = useState(""),
    [capability, setCapability] = useState(""),
    [showForm, setShowForm] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const shown = useMemo(
    () =>
      initialSuppliers.filter(
        (s) =>
          (!query ||
            [s.name, s.description, ...s.capabilities, ...s.brands].some((x) =>
              x.toLowerCase().includes(query.toLowerCase()),
            )) &&
          (!country || s.country === country) &&
          (!type || s.supplierType === type) &&
          (!capability ||
            s.capabilities.some((x) =>
              x.toLowerCase().includes(capability.toLowerCase()),
            )),
      ),
    [initialSuppliers, query, country, type, capability],
  );
  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(e.currentTarget),
      value = (name: string) => String(form.get(name) ?? "");
    const body = {
      name: value("name"),
      website: value("website"),
      country: value("country"),
      supplierType: value("supplierType"),
      description: value("description"),
      capabilities: split(value("capabilities")),
      regions: split(value("regions")),
      certifications: split(value("certifications")),
      brands: split(value("brands")),
      estimatedCapacityNotes: value("estimatedCapacityNotes"),
      leadTimeNotes: value("leadTimeNotes"),
      minimumOrderNotes: value("minimumOrderNotes"),
      generalNotes: value("generalNotes"),
    };
    try {
      const r = await fetch("/api/suppliers", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setMessage(
        j.duplicate
          ? "A matching private supplier already exists."
          : "Supplier added to your private directory.",
      );
      setShowForm(false);
      router.refresh();
    } catch (err) {
      setMessage(
        err instanceof Error ? err.message : "Supplier could not be saved.",
      );
    } finally {
      setBusy(false);
    }
  };
  const countries = [
    ...new Set(initialSuppliers.map((x) => x.country).filter(Boolean)),
  ];
  return (
    <>
      <div className="supplier-toolbar">
        <input
          aria-label="Search suppliers"
          placeholder="Search company, capability or brand"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
        >
          <option value="">All countries</option>
          {countries.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select
          aria-label="Supplier type"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">All supplier types</option>
          {TYPES.map(([v, l]) => (
            <option value={v} key={v}>
              {l}
            </option>
          ))}
        </select>
        <input
          aria-label="Capability"
          placeholder="Capability filter"
          value={capability}
          onChange={(e) => setCapability(e.target.value)}
        />
        <button
          className="black-button"
          disabled={setupRequired}
          onClick={() => setShowForm((x) => !x)}
        >
          Add supplier
        </button>
      </div>
      {showForm ? (
        <form className="supplier-form" onSubmit={submit}>
          <label>
            Company name
            <input name="name" required maxLength={300} />
          </label>
          <label>
            Website
            <input
              name="website"
              type="url"
              placeholder="https://example.com"
            />
          </label>
          <label>
            Country
            <input name="country" />
          </label>
          <label>
            Supplier type
            <select name="supplierType" required>
              {TYPES.map(([v, l]) => (
                <option value={v} key={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="wide">
            Description
            <textarea name="description" rows={2} />
          </label>
          <label>
            Capabilities
            <input name="capabilities" placeholder="IT hardware, Networking" />
          </label>
          <label>
            Regions served
            <input name="regions" placeholder="Germany, European Union" />
          </label>
          <label>
            Certifications
            <input name="certifications" placeholder="ISO 9001, ISO 27001" />
          </label>
          <label>
            Brands represented
            <input name="brands" placeholder="Dell, Lenovo" />
          </label>
          <label>
            Capacity notes
            <textarea name="estimatedCapacityNotes" />
          </label>
          <label>
            Lead-time notes
            <textarea name="leadTimeNotes" />
          </label>
          <label>
            Minimum order notes
            <textarea name="minimumOrderNotes" />
          </label>
          <label>
            General notes
            <textarea name="generalNotes" />
          </label>
          <div className="wide">
            <button className="black-button" disabled={busy}>
              {busy ? "Saving…" : "Save private supplier"}
            </button>
          </div>
        </form>
      ) : null}
      {message ? <div className="workspace-message">{message}</div> : null}
      <div className="supplier-section-heading">
        <div>
          <span className="section-label">MY SUPPLIERS</span>
          <h2>
            {shown.length} supplier{shown.length === 1 ? "" : "s"}
          </h2>
        </div>
        <span>Public discovery · Beta · no results imported automatically</span>
      </div>
      <div className="supplier-grid">
        {shown.map((s) => (
          <article className="supplier-card" key={s.id}>
            <header>
              <div>
                <span>{s.verificationStatus.replaceAll("_", " ")}</span>
                <h3>{s.name}</h3>
                <p>
                  {s.country} ·{" "}
                  {TYPES.find((x) => x[0] === s.supplierType)?.[1]}
                </p>
              </div>
            </header>
            <p>{s.description || "No description added."}</p>
            <div className="supplier-tags">
              {s.capabilities.map((x) => (
                <span key={x}>{x}</span>
              ))}
            </div>
            <dl>
              <div>
                <dt>Regions</dt>
                <dd>{s.regions.join(", ") || "Not listed"}</dd>
              </div>
              <div>
                <dt>Certifications</dt>
                <dd>{s.certifications.join(", ") || "Not verified"}</dd>
              </div>
              <div>
                <dt>Brands</dt>
                <dd>{s.brands.join(", ") || "Not listed"}</dd>
              </div>
            </dl>
            {s.website ? (
              <a href={s.website} target="_blank" rel="noopener noreferrer">
                Visit website ↗
              </a>
            ) : null}
          </article>
        ))}
        {!shown.length ? (
          <div className="state-card">
            <b>No suppliers matched.</b>
            <p>Add a private supplier or broaden the directory filters.</p>
          </div>
        ) : null}
      </div>
    </>
  );
}
