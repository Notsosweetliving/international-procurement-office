import type { CompanyProfile } from "../opportunities/types.ts";
import type { ComplianceStatus, RequirementLike } from "./types.ts";
const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, "");
export function suggestCompliance(
  requirement: RequirementLike,
  profile: CompanyProfile | null,
): { status: ComplianceStatus; reason: string } {
  if (!profile)
    return {
      status: "needs_review",
      reason: "Create a company profile and provide evidence.",
    };
  const haystack = [
      ...profile.certifications,
      ...profile.capabilities,
      ...profile.businessModels,
    ].map(norm),
    needle = norm(requirement.title + " " + requirement.description);
  if (requirement.requirementType === "certification") {
    const matched = profile.certifications.some(
      (x) =>
        needle.includes(norm(x)) || norm(x).includes(norm(requirement.title)),
    );
    return matched
      ? {
          status: "needs_evidence",
          reason:
            "Profile suggests match; certificate evidence is still required.",
        }
      : {
          status:
            requirement.mandatoryStatus === "mandatory"
              ? "missing"
              : "needs_review",
          reason: "Certification is not listed in the company profile.",
        };
  }
  if (
    requirement.requirementType === "experience" &&
    /government|public sector|federal/i.test(
      requirement.title + requirement.description,
    )
  ) {
    return /^none$/i.test(profile.governmentExperience.trim())
      ? {
          status: "missing",
          reason: "Company profile reports no government experience.",
        }
      : {
          status: "needs_evidence",
          reason:
            "Profile suggests relevant experience; comparable-contract evidence is required.",
        };
  }
  if (haystack.some((x) => x && needle.includes(x)))
    return {
      status: "likely_meets",
      reason:
        "Profile suggests match; tender-specific evidence still requires review.",
    };
  return {
    status: "needs_review",
    reason: "No deterministic profile match was found.",
  };
}
export function manualComplianceStatus(
  suggested: ComplianceStatus,
  manual?: ComplianceStatus | null,
) {
  return manual ?? suggested;
}
