import Link from "next/link";
import { Brand } from "@/components/app-shell";
import { Icon } from "@/components/icons";
export default function Home() {
  return (
    <main className="landing">
      <header>
        <Brand />
        <nav>
          <a href="#platform">Platform</a>
          <a href="#how">How it works</a>
          <Link href="/dashboard">Open workspace</Link>
        </nav>
      </header>
      <section className="hero">
        <div className="hero-kicker">
          <span />
          Global procurement intelligence
        </div>
        <h1>
          Find the government
          <br />
          contracts you can win.
        </h1>
        <p>
          International Procurement Office turns fragmented public procurement
          data into clear, company-specific intelligence so businesses can
          discover, qualify, prepare and pursue opportunities across markets.
        </p>
        <div className="hero-actions">
          <Link href="/dashboard">
            Explore the workspace <Icon name="arrow" />
          </Link>
          <a href="#platform">See how it works</a>
        </div>
        <div className="trust-line">
          <span>Built for serious procurement teams</span>
          <span>•</span>
          <span>Public-sector intelligence</span>
          <span>•</span>
          <span>AI-assisted analysis</span>
        </div>
      </section>
      <section className="product-preview" id="platform">
        <div className="preview-top">
          <span>INTELLIGENCE / RECOMMENDED</span>
          <span>Updated today</span>
        </div>
        {[
          [
            "94%",
            "EUROPEAN DEFENCE ORGANISATION",
            "Supply of Ruggedised Computing Equipment",
            "Belgium · IT & Communications · €2.8M estimated",
            "19 days",
          ],
          [
            "87%",
            "CABINET DIGITAL SERVICES",
            "Managed Cybersecurity Monitoring Service",
            "United Kingdom · Cybersecurity · £1.5M estimated",
            "12 days",
          ],
        ].map((x) => (
          <div className="preview-row" key={x[0]}>
            <b>{x[0]}</b>
            <div>
              <small>{x[1]}</small>
              <h2>{x[2]}</h2>
              <p>{x[3]}</p>
            </div>
            <span className="days">{x[4]}</span>
          </div>
        ))}
      </section>
      <section className="how" id="how">
        {[
          [
            "01 / DISCOVER",
            "One view across markets.",
            "Monitor relevant public opportunities across countries and categories without navigating fragmented portals.",
          ],
          [
            "02 / QUALIFY",
            "Know where you stand.",
            "Compare each tender with your company capabilities, regions, certifications and contract preferences.",
          ],
          [
            "03 / UNDERSTAND",
            "Turn documents into decisions.",
            "Surface requirements, risks and important dates with AI-assisted analysis clearly labelled for review.",
          ],
        ].map((x) => (
          <div key={x[0]}>
            <small>{x[0]}</small>
            <h3>{x[1]}</h3>
            <p>{x[2]}</p>
          </div>
        ))}
      </section>
      <footer className="landing-footer">
        International Procurement Office is an independent procurement
        intelligence platform and is not affiliated with or endorsed by any
        government agency.
      </footer>
    </main>
  );
}
