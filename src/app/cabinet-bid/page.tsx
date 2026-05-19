import { CabinetBidSummary } from "@/components/CabinetBidSummary";

export const metadata = {
  title: "Cabinet Bid Summary | Vulpine Bid Engine",
  description: "Enter unit types, quantities, and prices to generate a cabinet bid summary sheet.",
};

export default function CabinetBidPage() {
  return (
    <main className="page">
      <div className="shell">
        <div className="page-heading">
          <div>
            <h1>Cabinet Bid Summary</h1>
            <p>Enter unit types and quantities to generate a full cabinet quote summary.</p>
          </div>
        </div>
        <CabinetBidSummary />
      </div>
    </main>
  );
}
