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
          <p>Normalized public procurement intelligence from established official portals.</p>
        </div>
        <div className="source-register">
          {[["EU", "TED", "European Union procurement notices"], ["UK", "UK Government", "Find a Tender opportunities"], ["US", "US Federal", "Federal contract opportunities"]].map(([code, name, detail]) => (
            <article key={code}><span>{code}</span><div><h2>{name}</h2><p>{detail}</p></div></article>
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
      <footer className="landing-footer">
        International Procurement Office is an independent procurement
        intelligence platform and is not affiliated with or endorsed by any
        government agency.
      </footer>
    </main>
  );
}
