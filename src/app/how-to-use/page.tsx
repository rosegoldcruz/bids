import Image from "next/image";
import Link from "next/link";

const steps = [
  {
    title: "Use Product Sheets for lookup",
    body:
      "Open Product Sheets when you only need to search cabinet SKUs, descriptions, framed items, frameless items, or finish pricing from the master catalog.",
  },
  {
    title: "Use Dashboard for actual bids",
    body:
      "Open Dashboard when you need a real quote. Pick construction type, pick finish, paste SKU quantities, adjust operational costs, and review the grand total.",
  },
  {
    title: "Print Customer PDF for customers",
    body:
      "Use the Print Customer PDF button after the bid is reviewed. Choose Print or Save as PDF in the browser dialog. This customer document hides internal margin, factor, master list, and control numbers.",
  },
];

const rules = [
  "Do not quote from the old PDF brochure. Use the HTML Product Sheets or Dashboard.",
  "Do not send customers screenshots of the Dashboard. It contains internal pricing controls.",
  "Do not ignore missing SKU warnings. If a line says missing, fix the SKU or construction type before sending a quote.",
  "Do not change margin, discount, shipping, build, hardware, or install values unless the bid owner told you to.",
  "Do not mix framed and frameless SKUs in one quote unless the project manager approves it.",
];

const skuExamples = ["B12, 4", "B24, 2", "SB36, 1", "W3030, 4"];

export default function HowToUsePage() {
  return (
    <main className="page">
      <div className="shell guide-shell">
        <section className="guide-hero">
          <div>
            <div className="guide-brand">
              <Image src="/brand/vulpine-logo.svg" alt="Vulpine LLC" width={116} height={126} priority />
              <div>
                <div className="micro-label">VULPINE LLC BID ENGINE GUIDE</div>
                <h1>How to use the cabinet pricing tool.</h1>
              </div>
            </div>
            <p>
              This is the quick operating guide for price lookup, cabinet bids, and customer-ready PDF quotes. Use this
              app as the working source, because it is built from the Multi-Family Master Sheet logic.
            </p>
            <p className="guide-contact">Vulpine LLC | 480-364-8205 | sales@vulpinehomes.com</p>
          </div>
          <div className="guide-actions">
            <Link className="button" href="/dashboard">
              Open Dashboard
            </Link>
            <Link className="button secondary" href="/price-sheets">
              Open Product Sheets
            </Link>
          </div>
        </section>

        <section className="guide-grid">
          {steps.map((step, index) => (
            <article className="guide-card" key={step.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h2>{step.title}</h2>
              <p>{step.body}</p>
            </article>
          ))}
        </section>

        <section className="guide-section">
          <h2>Build a bid</h2>
          <div className="guide-two-column">
            <div>
              <ol className="guide-list">
                <li>Open the Dashboard.</li>
                <li>Choose Framed or Frameless. This must match the cabinet list.</li>
                <li>Choose the finish for the quote.</li>
                <li>Set Unit Quantity for how many identical units/packages are being quoted.</li>
                <li>Paste the SKU list using one item per line.</li>
                <li>Confirm there are zero missing SKUs.</li>
                <li>Review build, shipping, hardware, discount, install, and final total.</li>
                <li>Click Print Customer PDF when the bid is ready to send.</li>
              </ol>
            </div>
            <div className="example-box">
              <span>SKU format</span>
              <pre>{skuExamples.join("\n")}</pre>
              <p>Use commas, tabs, or spaces between SKU and quantity. If no quantity is entered, do not assume it is correct.</p>
            </div>
          </div>
        </section>

        <section className="guide-section">
          <h2>What the numbers mean</h2>
          <div className="definition-grid">
            <div>
              <strong>Price Margin</strong>
              <p>Internal pricing lever used in the master formula. It affects cabinet sell price. Keep it at the approved bid margin unless told otherwise.</p>
            </div>
            <div>
              <strong>Discount</strong>
              <p>Reduces the cabinet subtotal. It does not reduce build, hardware, shipping, or install line items.</p>
            </div>
            <div>
              <strong>Build $/Box</strong>
              <p>Assembly/build charge multiplied by the total cabinet box count.</p>
            </div>
            <div>
              <strong>Handle $</strong>
              <p>Hardware charge multiplied by the handle count from the master catalog.</p>
            </div>
            <div>
              <strong>Ship $/Unit</strong>
              <p>Delivery/shipping charge multiplied by Unit Quantity.</p>
            </div>
            <div>
              <strong>Install $/Box</strong>
              <p>Installation charge multiplied by total cabinet boxes when Include install is turned on.</p>
            </div>
          </div>
        </section>

        <section className="guide-section warning-section">
          <h2>Rules before sending anything</h2>
          <ul className="guide-list">
            {rules.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>

        <section className="guide-section">
          <h2>Customer PDF process</h2>
          <ol className="guide-list">
            <li>Finish the quote in Dashboard.</li>
            <li>Enter the customer name and project name if the proposal needs them.</li>
            <li>Confirm the Vulpine phone and email are correct: 480-364-8205 and sales@vulpinehomes.com.</li>
            <li>Click Print Customer PDF in the Grand Total Bid box.</li>
            <li>In the browser print dialog, choose Save as PDF if you need a file.</li>
            <li>Review the PDF before sending it. It should show the Vulpine logo, Vulpine LLC, contact info, line items, unit pricing, totals, and proposal total only.</li>
            <li>If the PDF shows internal controls or margin details, stop and use the Print Customer PDF button again from the Dashboard.</li>
          </ol>
        </section>
      </div>
    </main>
  );
}
