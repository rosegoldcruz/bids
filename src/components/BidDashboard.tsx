"use client";

import { useMemo, useState } from "react";
import { exactMoney, masterCatalog, masterFactor, money, type CatalogItem, type StyleName } from "@/lib/catalog";

type LineInput = {
  sku: string;
  qty: number;
};

function parseLines(text: string): LineInput[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [sku, qty = "1"] = line.split(/[,\t ]+/);
      return {
        sku: String(sku || "").toUpperCase(),
        qty: Math.max(0, Number(qty) || 0),
      };
    })
    .filter((line) => line.sku && line.qty > 0);
}

type DashboardState = {
  style: StyleName;
  finish: string;
  unitQty: number;
  priceMargin: number;
  discount: number;
  handlePrice: number;
  buildCostPerBox: number;
  shippingPerUnit: number;
  installCostPerBox: number;
  includeInstall: boolean;
  skuText: string;
};

function calculate(state: DashboardState) {
  const items = masterCatalog.styles[state.style].items;
  const factor = masterFactor(state.style, state.priceMargin);

  const lines = parseLines(state.skuText).map(({ sku, qty }) => {
    const item = items[sku] as CatalogItem | undefined;
    const listPrice = item?.prices[state.finish] ?? 0;
    const unitPrice = listPrice * factor;
    const lineTotal = qty * unitPrice;
    const handles = item?.type === "cabinet" ? qty * Number(item.handleCount || 0) : 0;

    return {
      sku,
      qty,
      item,
      found: Boolean(item),
      listPrice,
      unitPrice,
      lineTotal,
      handles,
    };
  });

  const perUnitCabinetTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const boxesPerUnit = lines.filter((line) => line.item?.type === "cabinet").reduce((sum, line) => sum + line.qty, 0);
  const handlesPerUnit = lines.reduce((sum, line) => sum + line.handles, 0);
  const unitQty = Math.max(1, state.unitQty || 1);
  const cabinetSubtotal = perUnitCabinetTotal * unitQty;
  const discountAmount = cabinetSubtotal * state.discount;
  const cabinetAfterDiscount = cabinetSubtotal - discountAmount;
  const totalBoxes = boxesPerUnit * unitQty;
  const totalHandles = handlesPerUnit * unitQty;
  const buildRevenue = totalBoxes * state.buildCostPerBox;
  const handleRevenue = totalHandles * state.handlePrice;
  const shipping = unitQty * state.shippingPerUnit;
  const install = state.includeInstall ? totalBoxes * state.installCostPerBox : 0;
  const grandTotal = cabinetAfterDiscount + buildRevenue + handleRevenue + shipping + install;

  return {
    factor,
    lines,
    perUnitCabinetTotal,
    boxesPerUnit,
    handlesPerUnit,
    cabinetSubtotal,
    discountAmount,
    cabinetAfterDiscount,
    totalBoxes,
    totalHandles,
    buildRevenue,
    handleRevenue,
    shipping,
    install,
    grandTotal,
  };
}

function NumberField({
  label,
  value,
  onChange,
  suffix,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix?: string;
  step?: number;
}) {
  return (
    <div>
      <label>{label}</label>
      <input
        className="field"
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
      />
      {suffix ? <div className="source-note">{suffix}</div> : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function VulpineLogo() {
  return (
    <div className="vulpine-logo" aria-hidden="true">
      <svg viewBox="0 0 80 80" fill="none">
        <path d="M40 4L70 18V42C70 58 56 70 40 76C24 70 10 58 10 42V18L40 4Z" fill="#1C2333" stroke="#C9992A" strokeWidth="2.5" />
        <path d="M40 12L62 23V42C62 55 52 65 40 70C28 65 18 55 18 42V23L40 12Z" fill="#0D1117" />
        <path d="M27 32L33 26L40 33L47 26L53 32V44L48 50H32L27 44V32Z" fill="#C9992A" opacity="0.82" />
        <circle cx="35" cy="34" r="2" fill="#F5D07A" />
        <circle cx="45" cy="34" r="2" fill="#F5D07A" />
        <path d="M37 40C38 42 42 42 43 40" stroke="#F5D07A" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function BidDashboard() {
  const defaults = masterCatalog.defaults;
  const [state, setState] = useState<DashboardState>({
    style: defaults.style,
    finish: defaults.finishByStyle[defaults.style],
    unitQty: 1,
    priceMargin: defaults.priceMargin,
    discount: defaults.discount,
    handlePrice: defaults.handlePrice,
    buildCostPerBox: defaults.buildCostPerBox,
    shippingPerUnit: defaults.shippingPerUnit,
    installCostPerBox: defaults.installCostPerBox,
    includeInstall: defaults.includeInstall,
    skuText: "B12, 4\nB24, 2\nSB36, 1\nW3030, 4",
  });

  const result = useMemo(() => calculate(state), [state]);
  const finishes = masterCatalog.styles[state.style].finishes;
  const missingCount = result.lines.filter((line) => !line.found).length;

  const patch = (updates: Partial<DashboardState>) => {
    setState((current) => ({ ...current, ...updates }));
  };

  const changeStyle = (style: StyleName) => {
    patch({
      style,
      finish: masterCatalog.defaults.finishByStyle[style] || masterCatalog.styles[style].finishes[0],
    });
  };

  return (
    <div className="bid-console">
      <aside className="tool-panel">
        <div className="panel-title-row">
          <VulpineLogo />
          <div>
            <h2>Mike-Logic Controls</h2>
            <p>Master sheet rates and overrides.</p>
          </div>
        </div>

        <label>Construction Type</label>
        <select value={state.style} onChange={(event) => changeStyle(event.target.value as StyleName)}>
          <option value="Framed">Framed</option>
          <option value="Frameless">Frameless</option>
        </select>

        <label>Finish</label>
        <select value={state.finish} onChange={(event) => patch({ finish: event.target.value })}>
          {finishes.map((finish) => (
            <option key={finish} value={finish}>
              {finish}
            </option>
          ))}
        </select>

        <NumberField label="Unit Quantity" value={state.unitQty} onChange={(unitQty) => patch({ unitQty })} />

        <label>Price Margin: {Math.round(state.priceMargin * 100)}%</label>
        <input
          type="range"
          min={0}
          max={0.5}
          step={0.01}
          value={state.priceMargin}
          onChange={(event) => patch({ priceMargin: Number(event.target.value) })}
        />
        <div className="source-note">
          Master factor: <strong>{result.factor.toFixed(5)}</strong>. Framed uses 0.185 x (0.9 + margin);
          frameless uses 0.126 x (1 + margin).
        </div>

        <div className="control-grid">
          <NumberField label="Discount %" value={state.discount * 100} onChange={(value) => patch({ discount: value / 100 })} />
          <NumberField label="Handle $" value={state.handlePrice} onChange={(handlePrice) => patch({ handlePrice })} step={0.1} />
          <NumberField label="Build $/Box" value={state.buildCostPerBox} onChange={(buildCostPerBox) => patch({ buildCostPerBox })} />
          <NumberField label="Ship $/Unit" value={state.shippingPerUnit} onChange={(shippingPerUnit) => patch({ shippingPerUnit })} />
          <NumberField label="Install $/Box" value={state.installCostPerBox} onChange={(installCostPerBox) => patch({ installCostPerBox })} />
          <label className="check-row">
            <input
              type="checkbox"
              checked={state.includeInstall}
              onChange={(event) => patch({ includeInstall: event.target.checked })}
            />
            Include install
          </label>
        </div>
      </aside>

      <section>
        <div className="dashboard-hero">
          <div>
            <div className="micro-label">VULPINE LLC · MASTER-DERIVED BID ENGINE</div>
            <h1>Cabinet Bid Dashboard</h1>
            <p>Paste SKUs and quantities. The tool prices against the master catalog for the selected style and finish.</p>
          </div>
          <div className="grand-total-card">
            <span>Grand Total Bid</span>
            <strong>{money(result.grandTotal)}</strong>
            <small>{state.style} · {state.finish} · {Math.round(state.priceMargin * 100)}% margin</small>
          </div>
        </div>

        <div className="stat-row">
          <StatCard label="Per Unit Cabinets" value={money(result.perUnitCabinetTotal)} />
          <StatCard label="Cabinet Subtotal" value={money(result.cabinetSubtotal)} />
          <StatCard label="Total Boxes" value={result.totalBoxes} />
          <StatCard label="Total Handles" value={result.totalHandles} />
          <StatCard label="Build Revenue" value={money(result.buildRevenue)} />
          <StatCard label="Shipping" value={money(result.shipping)} />
        </div>

        <div className="dashboard-grid">
          <div className="tool-panel">
            <h2>SKU List</h2>
            <p>Use one item per line. Example: B12, 4</p>
            <textarea value={state.skuText} onChange={(event) => patch({ skuText: event.target.value })} />
            <div className="source-note">
              {result.lines.length} line(s), {missingCount} missing from the selected catalog.
            </div>
          </div>

          <div className="tool-panel">
            <h2>Line Items</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Master List</th>
                    <th>Factor Price</th>
                    <th>Total</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {result.lines.map((line, index) => (
                    <tr className={line.found ? undefined : "missing"} key={`${line.sku}-${index}`}>
                      <td>{line.sku}</td>
                      <td>{line.item?.description || "Missing from selected master catalog"}</td>
                      <td>{line.qty}</td>
                      <td>{exactMoney(line.listPrice)}</td>
                      <td>{exactMoney(line.unitPrice)}</td>
                      <td>{exactMoney(line.lineTotal)}</td>
                      <td>{line.item?.type || "missing"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="stat-row" style={{ marginTop: 16 }}>
          <StatCard label="Cabinet After Discount" value={money(result.cabinetAfterDiscount)} />
          <StatCard label="Discount" value={money(result.discountAmount)} />
          <StatCard label="Handle Revenue" value={money(result.handleRevenue)} />
          <StatCard label="Install" value={money(result.install)} />
          <StatCard label="Master Factor" value={result.factor.toFixed(5)} />
          <StatCard label="Total Bid" value={money(result.grandTotal)} />
        </div>
      </section>
    </div>
  );
}
