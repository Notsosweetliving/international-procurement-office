import { Brand } from "@/components/app-shell";
import { OfficialBanner, SiteFooter } from "@/components/site-chrome";

const sections = [
  ["Information we handle", "IPO handles account details, company profile information, saved opportunities, bid-workspace and supplier information, uploaded tender documents, and AI analysis records when you use those features."],
  ["Usage and diagnostics", "The service records limited usage, ingestion, error, and security diagnostics needed to operate the product, enforce limits, and investigate failures. Sensitive keys and full customer lists are not intended for application logs."],
  ["Authentication and cookies", "IPO uses authentication sessions and related cookies to keep you signed in and protect private workspace routes."],
  ["Service providers", "IPO uses service providers where configured, including Supabase for authentication, database, and storage; OpenAI for requested AI-assisted features; Stripe for billing functions; and Vercel for application hosting. Data is shared only as needed to provide the relevant function."],
  ["Official procurement sources", "Public opportunity information originates from third-party procurement authorities. Source notices may have their own privacy and access terms."],
  ["Marketing email choice", "Promotional email consent is optional and unchecked by default. You may change your preference in Settings. IPO does not treat account creation alone as marketing consent."],
  ["Retention", "Workspace information is retained while your account is active and as needed to operate the service. Provider and legal obligations may require limited records to be retained for longer."],
  ["Account deletion", "You can request account deletion through the product's account settings. Deletion removes account-owned application data subject to operational, legal, and provider retention constraints."],
  ["Contact", "For privacy questions or account-data requests, email intelligence@internationalprocurementoffice.com."],
] as const;

export default function Privacy() {
  return <main className="public-info"><OfficialBanner /><header><Brand /><a href="/login">Login / Sign up</a></header><article><span className="section-label">DATA PRACTICES</span><h1>Privacy Policy</h1><p className="muted">This policy describes the data practices of the current International Procurement Office private beta.</p>{sections.map(([title, body]) => <section className="policy-section" key={title}><h2>{title}</h2><p>{body}</p></section>)}</article><SiteFooter /></main>;
}
