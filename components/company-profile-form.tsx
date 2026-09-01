/* eslint-disable react-hooks/set-state-in-effect -- one-time opt-in migration reads a legacy external store */
"use client";
import { useEffect, useState } from "react";
import {
  EMPTY_PROFILE,
  EXAMPLE_PROFILE,
  PROFILE_STORAGE_KEY,
  isCompanyProfile,
  profileCompleteness,
} from "@/lib/company/profile";
import type { CompanyProfile } from "@/lib/opportunities/types";
import { useCompanyProfile } from "./use-company-profile";
const MODELS = [
    "Manufacturer",
    "Distributor",
    "Reseller",
    "Systems Integrator",
    "Service Provider",
    "Consultant",
  ],
  CAPS = [
    "IT hardware",
    "Software",
    "Cybersecurity",
    "Networking",
    "Electronics",
    "Communications",
    "Clothing & Uniforms",
    "Logistics",
    "Vehicles",
    "Vehicle Parts",
    "Construction",
    "Medical Supplies",
    "Office Equipment",
    "Professional Services",
    "Other",
  ],
  REGIONS = [
    "United Kingdom",
    "European Union",
    "NATO",
    "United States",
    "Canada",
    "Australia",
    "Worldwide",
  ];
export function CompanyProfileForm() {
  const { profile, save } = useCompanyProfile();
  const [draft, setDraft] = useState<CompanyProfile | null>(null);
  const [legacy, setLegacy] = useState<CompanyProfile | null>(null);
  const [status, setStatus] = useState<"" | "saving" | "saved" | "error">("");
  useEffect(() => {
    if (profile) return;
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (isCompanyProfile(parsed)) setLegacy(parsed);
    } catch {}
  }, [profile]);
  const p = draft ?? profile ?? EMPTY_PROFILE;
  const update = <K extends keyof CompanyProfile>(
    key: K,
    value: CompanyProfile[K],
  ) => setDraft({ ...p, [key]: value });
  const toggle = (
    key: "businessModels" | "capabilities" | "regions",
    value: string,
  ) =>
    update(
      key,
      p[key].includes(value)
        ? p[key].filter((x) => x !== value)
        : [...p[key], value],
    );
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("saving");
    try {
      const response = await fetch("/api/company", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(p),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      save(data.profile);
      setDraft(data.profile);
      setStatus("saved");
      if (legacy) localStorage.removeItem(PROFILE_STORAGE_KEY);
      setLegacy(null);
    } catch {
      setStatus("error");
    }
  };
  return (
    <form onSubmit={submit}>
      {legacy ? (
        <div className="migration-offer">
          <div>
            <b>Import your existing local profile</b>
            <p>
              A valid IPO profile was found on this device. Review it before
              saving to your private workspace.
            </p>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setDraft(legacy)}
          >
            Import profile
          </button>
        </div>
      ) : null}
      <header className="page-header">
        <div>
          <div className="eyebrow">MATCHING INPUTS</div>
          <h1>Company profile</h1>
          <p>These details power transparent opportunity Match Scores.</p>
          {status === "saved" ? (
            <span className="saved-feedback">Saved</span>
          ) : status === "error" ? (
            <span className="auth-error">Profile could not be saved.</span>
          ) : null}
        </div>
        <div className="profile-actions">
          <div className="completeness">
            <strong>{profileCompleteness(p)}%</strong>
            <span>complete</span>
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={() => setDraft(EXAMPLE_PROFILE)}
          >
            Use example company
          </button>
          <button className="black-button" disabled={status === "saving"}>
            {status === "saving" ? "Saving…" : "Save profile"}
          </button>
        </div>
      </header>
      <div className="form-grid">
        <Form
          n="01"
          title="Company details"
          desc="Your organisation's core information."
        >
          <div className="fields">
            <Field
              label="Company name"
              value={p.name}
              onChange={(v) => update("name", v)}
            />
            <label>
              Country of incorporation
              <select
                value={p.country}
                onChange={(e) => update("country", e.target.value)}
              >
                <option value="">Select country</option>
                {[
                  "United Kingdom",
                  "Ireland",
                  "Germany",
                  "France",
                  "Belgium",
                  "Netherlands",
                  "United States",
                  "Canada",
                  "Australia",
                  "Other",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <Field
              wide
              label="Website"
              value={p.website}
              onChange={(v) => update("website", v)}
            />
          </div>
        </Form>
        <Form
          n="02"
          title="Business model"
          desc="How your company fulfils contracts."
        >
          <Checks
            items={MODELS}
            checked={p.businessModels}
            toggle={(x) => toggle("businessModels", x)}
          />
        </Form>
        <Form
          n="03"
          title="Capabilities"
          desc="Select every category your company can deliver."
        >
          <Checks
            items={CAPS}
            checked={p.capabilities}
            toggle={(x) => toggle("capabilities", x)}
          />
        </Form>
        <Form
          n="04"
          title="Commercial fit"
          desc="Set the value range you prefer to pursue."
        >
          <div className="fields">
            <label>
              Currency
              <select
                value={p.preferredCurrency ?? "GBP"}
                onChange={(e) => update("preferredCurrency", e.target.value)}
              >
                {["GBP", "EUR", "USD"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Minimum preferred value
              <input
                type="number"
                min="0"
                value={p.minContractValue}
                onChange={(e) =>
                  update("minContractValue", Number(e.target.value))
                }
              />
            </label>
            <label>
              Maximum preferred value
              <input
                type="number"
                min="0"
                value={p.maxContractValue}
                onChange={(e) =>
                  update("maxContractValue", Number(e.target.value))
                }
              />
            </label>
          </div>
        </Form>
        <Form
          n="05"
          title="Regions served"
          desc="Where your company can support opportunities."
        >
          <Checks
            items={REGIONS}
            checked={p.regions}
            toggle={(x) => toggle("regions", x)}
          />
        </Form>
        <Form
          n="06"
          title="Experience & certifications"
          desc="Signals used where the notice contains matching references."
        >
          <div className="fields">
            <label className="wide">
              Certifications — comma separated
              <input
                value={p.certifications.join(", ")}
                onChange={(e) =>
                  update(
                    "certifications",
                    e.target.value
                      .split(",")
                      .map((x) => x.trim())
                      .filter(Boolean),
                  )
                }
              />
            </label>
            <label className="wide">
              Government experience
              <select
                value={p.governmentExperience}
                onChange={(e) => update("governmentExperience", e.target.value)}
              >
                {[
                  "None",
                  "Some government experience",
                  "Experienced government contractor",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          </div>
        </Form>
      </div>
    </form>
  );
}
function Form({
  n,
  title,
  desc,
  children,
}: {
  n: string;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-card">
      <div className="card-title">
        <span>{n}</span>
        <div>
          <h2>{title}</h2>
          <p>{desc}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
function Checks({
  items,
  checked,
  toggle,
}: {
  items: string[];
  checked: string[];
  toggle: (x: string) => void;
}) {
  return (
    <div className="check-grid">
      {items.map((x) => (
        <label key={x} className={checked.includes(x) ? "checked" : ""}>
          <input
            type="checkbox"
            checked={checked.includes(x)}
            onChange={() => toggle(x)}
          />
          <span>✓</span>
          {x}
        </label>
      ))}
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
}) {
  return (
    <label className={wide ? "wide" : ""}>
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
