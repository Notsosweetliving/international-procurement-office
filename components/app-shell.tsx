import Link from "next/link";
import type { CompanyProfile } from "@/lib/opportunities/types";
import { CompanyProfileProvider } from "./use-company-profile";
import { Icon } from "./icons";
import Image from "next/image";
const nav = [
  ["grid", "Intelligence", "/dashboard"],
  ["search", "Opportunities", "/opportunities"],
  ["bookmark", "Saved", "/saved"],
  ["building", "Company", "/company"],
];
export function Brand() {
  return (
    <Link href="/" className="brand">
      <Image
        className="brand-seal"
        src="/ipo-logo.png"
        alt=""
        width={56}
        height={56}
        priority
      />
    </Link>
  );
}
export function AppShell({
  children,
  profile,
  email,
}: {
  children: React.ReactNode;
  profile: CompanyProfile | null;
  email: string;
}) {
  const label = profile?.name || email;
  return (
    <CompanyProfileProvider initialProfile={profile}>
      <div className="app-shell">
        <aside className="sidebar">
          <Brand />
          <nav>
            {nav.map(([i, l, h]) => (
              <Link href={h} key={h}>
                <Icon name={i} />
                <span>{l}</span>
              </Link>
            ))}
          </nav>
          <div className="sidebar-foot">
            <Link href="/settings">
              <Icon name="settings" />
              <span>Settings</span>
            </Link>
            <div className="account">
              <span>{label.slice(0, 2).toUpperCase()}</span>
              <div>
                <strong>{label}</strong>
                <small>Private workspace</small>
              </div>
            </div>
          </div>
        </aside>
        <div className="mobilebar">
          <Brand />
          <Link href="/opportunities">
            <Icon name="search" />
          </Link>
        </div>
        <main className="app-main">{children}</main>
        <nav className="mobile-nav">
          {nav.map(([i, l, h]) => (
            <Link href={h} key={h}>
              <Icon name={i} />
              <small>{l}</small>
            </Link>
          ))}
        </nav>
      </div>
    </CompanyProfileProvider>
  );
}
