import Link from "next/link";
import { masterCatalog } from "@/lib/catalog";

export default function Home() {
  const framedCount = Object.keys(masterCatalog.styles.Framed.items).length;
  const framelessCount = Object.keys(masterCatalog.styles.Frameless.items).length;

  return (
    <main className="page">
      <div className="shell hero">
        <section className="hero-main">
          <div>
            <h1>Vulpine cabinet command center.</h1>
            <p className="hero-copy">
              Two giant buttons. One opens the master-derived HTML price sheets. One opens the actual bid dashboard.
              No PDF guessing, no hidden Excel hunt, no wandering around.
            </p>
          </div>

          <div className="hero-actions">
            <Link className="big-cta" href="/price-sheets">
              <span>
                <strong>OPEN PRODUCT SHEETS</strong>
                <span>Search framed and frameless cabinet catalog pricing pulled from the Multi-Family Master Sheet.</span>
              </span>
              <span className="arrow-box">›</span>
            </Link>

            <Link className="big-cta secondary" href="/dashboard">
              <span>
                <strong>OPEN BID CALCULATOR</strong>
                <span>Paste SKUs, choose finish, tweak margin and operational costs, then quote from master logic.</span>
              </span>
              <span className="arrow-box">›</span>
            </Link>
          </div>
        </section>

        <aside className="hero-side">
          <div className="cta-card">
            <h2>What is live here</h2>
            <p>
              This app bundles the master cabinet catalog into the site so employees do not need to open Excel just to
              look up cabinet pricing or build a working bid.
            </p>
            <div className="metric-grid">
              <div className="metric">
                <span>Framed Items</span>
                <strong>{framedCount}</strong>
              </div>
              <div className="metric">
                <span>Frameless Items</span>
                <strong>{framelessCount}</strong>
              </div>
              <div className="metric">
                <span>Framed 26% Factor</span>
                <strong>0.2146</strong>
              </div>
              <div className="metric">
                <span>Frameless 26% Factor</span>
                <strong>0.15876</strong>
              </div>
            </div>
          </div>

          <div className="cta-card">
            <h2>Use the HTML price sheets</h2>
            <p>
              The PDF brochure is only a meeting handout. This web app is the searchable HTML product sheet and working
              bid tool.
            </p>
          </div>

          <div className="cta-card">
            <h2>Master logic</h2>
            <p>
              Framed factor follows 0.185 x (0.9 + margin). Frameless follows 0.126 x (1 + margin). Operational costs
              stay visible so the team can adjust the quote intentionally.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
