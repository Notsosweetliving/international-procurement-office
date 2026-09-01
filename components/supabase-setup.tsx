import Link from "next/link";
export function SupabaseSetup() {
  return (
    <main className="setup-page">
      <div className="state-card">
        <span className="section-label">DEVELOPMENT SETUP</span>
        <h1>Supabase is not configured for this environment.</h1>
        <p>
          Add the public Supabase URL and anonymous key to{" "}
          <code>.env.local</code>, apply the included migration, and restart the
          development server.
        </p>
        <Link className="black-button" href="/">
          Return to public site
        </Link>
      </div>
    </main>
  );
}
