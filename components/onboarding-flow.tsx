"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMPTY_PROFILE } from "@/lib/company/profile";
import type { CompanyProfile } from "@/lib/opportunities/types";
import { Brand } from "@/components/app-shell";
const CAPS = [
    "IT hardware",
    "Software",
    "Cybersecurity",
    "Networking",
    "Professional services",
    "Construction",
    "Medical supplies",
  ],
  REGIONS = [
    "United Kingdom",
    "European Union",
    "United States",
    "NATO",
    "Worldwide",
  ];
export function OnboardingFlow({
  initial,
}: {
  initial: CompanyProfile | null;
}) {
  const router = useRouter(),
    [step, setStep] = useState(1),
    [profile, setProfile] = useState(initial ?? EMPTY_PROFILE),
    [search, setSearch] = useState("");
  const update = <K extends keyof CompanyProfile>(k: K, v: CompanyProfile[K]) =>
      setProfile({ ...profile, [k]: v }),
    toggle = (k: "capabilities" | "regions", v: string) =>
      update(
        k,
        profile[k].includes(v)
          ? profile[k].filter((x) => x !== v)
          : [...profile[k], v],
      );
  async function next() {
    if (step < 6) {
      setStep(step + 1);
      return;
    }
    await fetch("/api/company", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(profile),
    });
    router.push(
      `/opportunities?q=${encodeURIComponent(search || profile.capabilities[0] || "")}`,
    );
  }
  return (
    <main className="onboarding-page">
      <div className="onboarding-card">
        <Brand />
        <header>
          <span className="section-label">PRIVATE BETA ONBOARDING</span>
          <b>{step} of 6</b>
          <div className="onboarding-progress">
            <i style={{ width: `${(step / 6) * 100}%` }} />
          </div>
        </header>
        {step === 1 ? (
          <Step
            title="Company basics"
            copy="Start with the essentials. You can complete the rest later."
          >
            <label>
              Company name
              <input
                value={profile.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            <label>
              Country
              <input
                value={profile.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </label>
          </Step>
        ) : null}
        {step === 2 ? (
          <Step
            title="Capabilities"
            copy="Choose the work your company can genuinely deliver."
          >
            <Checks
              values={CAPS}
              selected={profile.capabilities}
              toggle={(x) => toggle("capabilities", x)}
            />
          </Step>
        ) : null}
        {step === 3 ? (
          <Step
            title="Regions served"
            copy="Where can your company support contracts?"
          >
            <Checks
              values={REGIONS}
              selected={profile.regions}
              toggle={(x) => toggle("regions", x)}
            />
          </Step>
        ) : null}
        {step === 4 ? (
          <Step
            title="Contract size preferences"
            copy="Optional ranges improve opportunity ranking."
          >
            <label>
              Minimum value
              <input
                type="number"
                min="0"
                value={profile.minContractValue}
                onChange={(e) =>
                  update("minContractValue", Number(e.target.value))
                }
              />
            </label>
            <label>
              Maximum value
              <input
                type="number"
                min="0"
                value={profile.maxContractValue}
                onChange={(e) =>
                  update("maxContractValue", Number(e.target.value))
                }
              />
            </label>
          </Step>
        ) : null}
        {step === 5 ? (
          <Step
            title="Government experience"
            copy="Select the closest current description."
          >
            <select
              value={profile.governmentExperience}
              onChange={(e) => update("governmentExperience", e.target.value)}
            >
              <option>None</option>
              <option>Some government experience</option>
              <option>Experienced government contractor</option>
            </select>
          </Step>
        ) : null}
        {step === 6 ? (
          <Step
            title="Your IPO workspace is ready."
            copy="Start with a suggested search based on your capabilities."
          >
            <label>
              First search
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={profile.capabilities[0] || "cybersecurity"}
              />
            </label>
          </Step>
        ) : null}
        <footer>
          {step > 1 ? (
            <button className="ghost-button" onClick={() => setStep(step - 1)}>
              Back
            </button>
          ) : (
            <span />
          )}
          {step < 6 ? (
            <button className="ghost-button" onClick={() => setStep(step + 1)}>
              Skip
            </button>
          ) : null}
          <button className="black-button" onClick={() => void next()}>
            {step === 6 ? "View matched opportunities" : "Continue"}
          </button>
        </footer>
      </div>
    </main>
  );
}
function Step({
  title,
  copy,
  children,
}: {
  title: string;
  copy: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h1>{title}</h1>
      <p>{copy}</p>
      <div className="onboarding-fields">{children}</div>
    </section>
  );
}
function Checks({
  values,
  selected,
  toggle,
}: {
  values: string[];
  selected: string[];
  toggle: (x: string) => void;
}) {
  return (
    <div className="onboarding-checks">
      {values.map((x) => (
        <label key={x}>
          <input
            type="checkbox"
            checked={selected.includes(x)}
            onChange={() => toggle(x)}
          />
          {x}
        </label>
      ))}
    </div>
  );
}
