import { Brand } from "@/components/app-shell";
import { OfficialBanner, SiteFooter } from "@/components/site-chrome";

const sections = [
  ["Acceptance", "By creating an account or using IPO, you agree to these terms. If you do not agree, do not use the service."],
  ["Service description", "IPO is a private-beta procurement intelligence workspace for discovering, reviewing, and organizing public contract opportunities."],
  ["Accounts", "You are responsible for accurate account information, safeguarding access credentials, and activity performed through your account."],
  ["Permitted use", "Use IPO lawfully for legitimate procurement research and bid preparation. Do not misuse the service, disrupt it, or attempt unauthorized access."],
  ["Procurement information accuracy", "Procurement notices may change, contain omissions, or be delayed. Always verify eligibility, requirements, deadlines, and amendments against the official source before acting."],
  ["AI-assisted content", "AI summaries and analyses may be incomplete or incorrect. They are assistance tools and must be checked against source documents."],
  ["No legal or procurement advice", "IPO does not provide legal, financial, or professional procurement advice and does not make bid decisions or submit bids for you."],
  ["Third-party and public-source data", "IPO organizes information from public procurement authorities and may link to third-party services. Those sources remain responsible for their own content and availability."],
  ["Intellectual property", "IPO's software, branding, and original interface content remain protected. Rights in public notices and uploaded customer materials remain with their respective owners."],
  ["Availability", "Private-beta features may change, be interrupted, or be withdrawn. IPO does not promise uninterrupted or error-free availability."],
  ["Limitations", "To the extent permitted by applicable law, IPO is not responsible for procurement decisions, missed opportunities, or losses arising from reliance on unverified information."],
  ["Account termination", "You may request account deletion. IPO may restrict accounts used unlawfully, abusively, or in material breach of these terms."],
  ["Contact", "Questions about these terms can be sent to intelligence@internationalprocurementoffice.com."],
] as const;

export default function Terms() {
  return <main className="public-info"><OfficialBanner /><header><Brand /><a href="/login">Login / Sign up</a></header><article><span className="section-label">PRIVATE BETA</span><h1>Terms</h1><p className="muted">These high-level terms apply to the current International Procurement Office private beta.</p>{sections.map(([title, body]) => <section className="policy-section" key={title}><h2>{title}</h2><p>{body}</p></section>)}</article><SiteFooter /></main>;
}
