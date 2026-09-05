import { Brand } from "@/components/app-shell";
import { OfficialBanner, SiteFooter } from "@/components/site-chrome";
export default function ContactPage() {
  return <main className="public-info"><OfficialBanner /><header><Brand /><a href="/login">Login / Sign up</a></header><article><span className="section-label">CONTACT</span><h1>Contact International Procurement Office</h1><p>For procurement intelligence, account support, or product questions, contact:</p><a className="contact-email" href="mailto:intelligence@internationalprocurementoffice.com">intelligence@internationalprocurementoffice.com</a><p className="muted">We have not added a contact form because no transactional email service is configured. Email remains the direct support channel.</p></article><SiteFooter /></main>;
}
