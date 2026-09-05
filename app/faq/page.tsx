import { Brand } from "@/components/app-shell";
import { OfficialBanner, SiteFooter } from "@/components/site-chrome";
const FAQ = [
  ["What is International Procurement Office?", "IPO is an independent platform for discovering, qualifying, and reviewing public procurement opportunities."],
  ["Where do opportunities come from?", "Opportunities are normalized from official public procurement sources and served from IPO's secure procurement cache."],
  ["Which procurement sources are supported?", "IPO currently supports EU TED, UK Find a Tender, and US Federal SAM.gov data when available."],
  ["How does Match Score work?", "Match Score deterministically compares normalized opportunity fields with your saved company profile."],
  ["Does IPO submit bids for me?", "No. IPO supports your review and preparation; your company remains responsible for every submission and decision."],
  ["How does AI tender analysis work?", "AI produces validated summaries and requirement guidance from available notice and document text. Important details should be verified against the official notice."],
  ["Is IPO a government agency?", "No. IPO is independent and is not affiliated with or endorsed by any government agency."],
  ["How often are opportunities updated?", "The procurement cache is refreshed on the schedule shown by IPO's source freshness indicators."],
  ["Can I save opportunities?", "Yes. Signed-in users can save opportunities and open private bid workspaces."],
  ["How is my company data protected?", "Company and workspace records are access-controlled by authenticated ownership policies."],
  ["How do I contact support?", "Email intelligence@internationalprocurementoffice.com."],
] as const;
export default function FaqPage() { return <main className="public-info"><OfficialBanner /><header><Brand /><a href="/login">Login / Sign up</a></header><article><span className="section-label">GUIDANCE</span><h1>Frequently asked questions</h1><div className="faq-list">{FAQ.map(([q,a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div></article><SiteFooter /></main>; }
