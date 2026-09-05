import Link from "next/link";
import { Icon } from "./icons";

export function OfficialBanner() {
  return <details className="official-banner"><summary><Icon name="globe" /><span>An official website of the International Procurement Office</span><small>About this site</small></summary><p>International Procurement Office is an independent procurement intelligence platform.</p></details>;
}
export function SiteFooter({ authenticated = false }: { authenticated?: boolean }) {
  return <footer className={`site-footer${authenticated ? " authenticated" : ""}`}><div><strong>International Procurement Office</strong><nav><Link href="/contact">Contact</Link><Link href="/faq">FAQ</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link>{authenticated ? <Link href="/settings">Settings</Link> : null}</nav></div><a href="mailto:intelligence@internationalprocurementoffice.com">intelligence@internationalprocurementoffice.com</a><p>International Procurement Office is an independent procurement intelligence platform and is not affiliated with or endorsed by any government agency.</p></footer>;
}
