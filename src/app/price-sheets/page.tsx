import Link from "next/link";
import { PriceSheets } from "@/components/PriceSheets";

export default function PriceSheetsPage() {
  return (
    <main className="page">
      <div className="shell">
        <div className="page-heading">
          <div>
            <h1>Price Sheets</h1>
            <p>
              Master-derived HTML catalog for framed and frameless cabinets. This is the page employees should open for
              product pricing.
            </p>
          </div>
          <Link className="button" href="/dashboard">
            Build A Bid
          </Link>
        </div>
        <PriceSheets />
      </div>
    </main>
  );
}
