import { signOut } from "@/app/auth-actions";
import { getAuthenticatedUser } from "@/lib/supabase/server";
import { getCompanyProfile } from "@/lib/repositories/company";
import { isAiAvailable } from "@/lib/ai/client";
import { ClearLocalProfileButton } from "@/components/clear-local-profile-button";
import Link from "next/link";
import { DeleteAccountButton } from "@/components/delete-account-button";
import { BillingButton } from "@/components/billing-button";
import { PasswordUpdate } from "@/components/password-update";
export default async function Settings() {
  const { client, user } = await getAuthenticatedUser();
  if (!client || !user) return null;
  const profile = await getCompanyProfile(client, user.id);
  return (
    <div className="page">
      <header className="page-header">
        <div>
          <div className="eyebrow">WORKSPACE</div>
          <h1>Settings</h1>
          <p>
            Manage your International Procurement Office account and workspace.
          </p>
        </div>
      </header>
      <div className="settings-grid">
        <Setting title="ACCOUNT">
          <p>
            <b>Email</b>
            <br />
            {user.email}
          </p>
          <form action={signOut}>
            <button className="ghost-button">Sign out</button>
          </form>
          <PasswordUpdate />
        </Setting>
        <Setting title="WORKSPACE">
          <p>
            <b>Company</b>
            <br />
            {profile?.name || "Not configured"}
          </p>
          <p>
            <b>Preferred currency</b>
            <br />
            {profile?.preferredCurrency || "Not configured"}
          </p>
          <Link href="/company">Edit company profile →</Link>
        </Setting>
        <Setting title="PLAN">
          <p>
            <b>Beta Free</b>
            <br />
            Private beta limits reset monthly.
          </p>
          <ul className="usage-list">
            <li>10 AI analyses</li>
            <li>3 active Bid Workspaces</li>
            <li>25 suppliers</li>
            <li>5 saved searches</li>
          </ul>
          <BillingButton />
        </Setting>
        <Setting title="ALERTS">
          <p>
            Daily and weekly alert preferences are managed per saved search.
            Delivery remains queued until an email provider is configured.
          </p>
          <Link href="/saved-searches">Manage saved-search alerts →</Link>
        </Setting>
        <Setting title="AI">
          <p>
            <b>{isAiAvailable() ? "AI configured" : "AI unavailable"}</b>
          </p>
          <p>
            Configuration is managed securely on the server. API keys are never
            displayed.
          </p>
        </Setting>
        <Setting title="DATA">
          <p>
            <a href="/api/account/export">Export basic workspace data</a>
          </p>
          <p>
            Remove the legacy device-only company profile after importing it.
          </p>
          <ClearLocalProfileButton />
          <hr />
          <DeleteAccountButton />
        </Setting>
      </div>
    </div>
  );
}
function Setting({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="form-card">
      <span className="section-label">{title}</span>
      {children}
    </section>
  );
}
