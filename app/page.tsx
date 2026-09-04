import Link from "next/link";
import { Brand } from "@/components/app-shell";
import { Icon } from "@/components/icons";
import { getAuthenticatedUser } from "@/lib/supabase/server";
export default async function Home() {
  const { user } = await getAuthenticatedUser();
  return (
    <main className="landing">
      <header>
        <Brand />
        <nav>
          <a href="#platform">Sources</a>
          <a href="#how">How it works</a>
          <Link href={user ? "/dashboard" : "/login"}>{user ? "Open workspace" : "Login / Sign up"}</Link>
        </nav>
      </header>
      <section className="hero">
        <div className="hero-kicker">Global procurement intelligence</div>
        <h1>
          <span>Find the government</span>
          <span>{" "}contracts you can win.</span>
        </h1>
        <p>
          International Procurement Office turns fragmented public procurement
          data into clear, company-specific intelligence across global markets.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard">
            Open workspace <Icon name="arrow" />
          </Link>
          <a href="#platform">See how it works</a>
        </div>
      </section>
      <section className="official-sources" id="platform">
        <div className="landing-section-heading">
          <span>OFFICIAL PROCUREMENT SOURCES</span>
          <p>Public notices normalized from established procurement authorities.</p>
        </div>
        <div className="source-register">
          {[["01", "EU TED", "European Union", "Procurement notices"], ["02", "UK Government", "United Kingdom", "Find a Tender"], ["03", "US Federal", "United States", "Contract opportunities"]].map(([number, name, jurisdiction, detail]) => (
            <article key={number}><span>{number}</span><h2>{name}</h2><p>{jurisdiction}</p><small>{detail}</small></article>
          ))}
        </div>
      </section>
      <section className="how" id="how">
        <div className="how-heading">
          <span>PROCUREMENT INTELLIGENCE</span>
          <p>A disciplined path from market discovery to bid decision.</p>
        </div>
        {[
          [
            "01",
            "Discover",
            "Find relevant public contracts across global markets.",
          ],
          [
            "02",
            "Qualify",
            "Rank opportunities against your company profile.",
          ],
          [
            "03",
            "Analyse",
            "Review tender requirements with clearly labelled AI assistance.",
          ],
          [
            "04",
            "Pursue",
            "Prepare evidence and make informed bid decisions.",
          ],
        ].map((x) => (
          <div key={x[0]}>
            <small>{x[0]}</small>
            <h3>{x[1]}</h3>
            <p>{x[2]}</p>
          </div>
        ))}
      </section>
      <section className="credibility-strip" aria-label="Platform standards">
        {["Official public procurement sources", "Company-specific opportunity matching", "Structured AI tender review", "Secure private workspaces"].map((item) => (
          <span key={item}>{item}</span>
        ))}
      </section>
      <footer className="landing-footer">
        <span>INDEPENDENT PROCUREMENT INTELLIGENCE</span>
        <p>International Procurement Office is an independent procurement intelligence platform and is not affiliated with or endorsed by any government agency.</p>
      </footer>
    </main>
  );
}
