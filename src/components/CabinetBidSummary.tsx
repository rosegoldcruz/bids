"use client";

import { useMemo, useState, useCallback } from "react";
import { exactMoney } from "@/lib/catalog";
import {
  calculateBid,
  uid,
  validateProject,
  validateRow,
  DEMO_PROJECT,
  makeDemoUnits,
  STORAGE_KEY,
  type ProjectFields,
  type UnitRow,
} from "@/lib/cabinetBid";

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_PROJECT: ProjectFields = {
  projectName: "",
  builderName: "",
  clientName: "",
  bidDate: new Date().toISOString().slice(0, 10),
  productLine: "Frameless",
  expectedTotalUnits: 0,
  doorMaterial: "",
  boxMaterial: "",
  drawerRunner: "",
  shelfMaterial: "",
  hingeType: "",
  doorStyle: "",
  installationTotal: 0,
  buildCost: 0,
  shippingCost: 0,
  taxRate: 0,
  handleUnitCost: 0,
};

function emptyRow(): UnitRow {
  return { id: uid(), product: "", unitType: "", quantity: 0, unitPrice: 0, cabinetsPerUnit: 0, hardwarePerUnit: 0, notes: "" };
}

// ─── Persistence (localStorage) ───────────────────────────────────────────────

function saveToStorage(project: ProjectFields, units: UnitRow[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ project, units }));
  } catch {
    /* storage full or unavailable */
  }
}

function loadFromStorage(): { project: ProjectFields; units: UnitRow[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    // Merge with defaults so stale/missing keys don't cause runtime errors
    const project: ProjectFields = { ...DEFAULT_PROJECT, ...(parsed.project ?? {}) };
    const units: UnitRow[] = Array.isArray(parsed.units)
      ? parsed.units.map((u: Partial<UnitRow>) => ({
          id: u.id ?? uid(),
          product: u.product ?? "",
          unitType: u.unitType ?? "",
          quantity: Number(u.quantity) || 0,
          unitPrice: Number(u.unitPrice) || 0,
          cabinetsPerUnit: Number(u.cabinetsPerUnit) || 0,
          hardwarePerUnit: Number(u.hardwarePerUnit) || 0,
          notes: u.notes ?? "",
        }))
      : [emptyRow()];
    return { project, units };
  } catch {
    return null;
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

// ─── Small UI helpers ─────────────────────────────────────────────────────────

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
  min,
  step,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  step?: number;
}) {
  return (
    <div>
      <label className="cb-label">{label}</label>
      <input
        className="field"
        type={type}
        value={value}
        placeholder={placeholder}
        min={min}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <Field
      label={label}
      type="number"
      value={value}
      step={step}
      min={min}
      onChange={(v) => onChange(Number(v) || 0)}
    />
  );
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function exportCSV(project: ProjectFields, calc: ReturnType<typeof calculateBid>) {
  const rows: string[][] = [
    ["Cabinet Bid Summary"],
    ["Project", project.projectName],
    ["Builder", project.builderName],
    ["Client", project.clientName],
    ["Date", project.bidDate],
    ["Product Line", project.productLine],
    [],
    ["Product", "Unit Type", "Qty", "Unit Price", "Total", "Total Cabinets", "Hardware Count", "Notes"],
    ...calc.rows.map((r) => [
      r.product, r.unitType, String(r.quantity),
      r.unitPrice.toFixed(2), r.rowTotal.toFixed(2),
      String(r.rowTotalCabinets), String(r.rowHardwareCount), r.notes,
    ]),
    [],
    ["", "", String(calc.enteredTotalUnits), "Cabinets", calc.cabinetSubtotal.toFixed(2), String(calc.totalCabinets), String(calc.totalHardwareCount)],
    ["", "Handles", "", "", calc.handlesTotal.toFixed(2)],
    ["", "Build Cost", "", "", project.buildCost.toFixed(2)],
    ["", "Shipping", "", "", project.shippingCost.toFixed(2)],
    ["", "Tax", "", "", calc.tax.toFixed(2)],
    ["", "Total (pre-install)", "", "", calc.preInstallTotal.toFixed(2)],
    ["", "Cabinet Installation", "", "", project.installationTotal.toFixed(2)],
    ["", "Grand Total", "", "", calc.grandTotal.toFixed(2)],
    [],
    ["General Specifications"],
    ["Door Material", project.doorMaterial],
    ["Box Material", project.boxMaterial],
    ["Shelves", project.shelfMaterial],
    ["Hinge", project.hingeType],
    ["Drawer Runner", project.drawerRunner],
    ["Door Style", project.doorStyle],
  ];

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.projectName || "cabinet-bid"}.csv`;
  a.click();
  // Defer revocation so the browser has time to initiate the download
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CabinetBidSummary() {
  const [project, setProject] = useState<ProjectFields>(DEFAULT_PROJECT);
  const [units, setUnits] = useState<UnitRow[]>([emptyRow()]);
  const [saveMsg, setSaveMsg] = useState("");

  const calc = useMemo(() => calculateBid(project, units), [project, units]);

  const patchProject = useCallback((updates: Partial<ProjectFields>) => {
    setProject((p) => ({ ...p, ...updates }));
  }, []);

  const patchRow = useCallback((id: string, updates: Partial<UnitRow>) => {
    setUnits((rows) => rows.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  }, []);

  const addRow = () => setUnits((rows) => [...rows, emptyRow()]);

  const duplicateRow = (id: string) => {
    setUnits((rows) => {
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return rows;
      const copy = { ...rows[idx], id: uid() };
      return [...rows.slice(0, idx + 1), copy, ...rows.slice(idx + 1)];
    });
  };

  const removeRow = (id: string) => {
    setUnits((rows) => (rows.length > 1 ? rows.filter((r) => r.id !== id) : rows));
  };

  const handleSave = () => {
    const projErrors = validateProject(project);
    const rowErrors = units.flatMap(validateRow);
    const all = [...projErrors, ...rowErrors];
    if (all.length) {
      setSaveMsg("Fix errors before saving: " + all[0]);
      return;
    }
    saveToStorage(project, units);
    setSaveMsg("Saved to local browser storage.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleLoad = () => {
    const saved = loadFromStorage();
    if (!saved) {
      setSaveMsg("No saved project found in local browser storage.");
      setTimeout(() => setSaveMsg(""), 3000);
      return;
    }
    setProject(saved.project);
    setUnits(saved.units);
    setSaveMsg("Project loaded from local browser storage.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleClear = () => {
    clearStorage();
    setProject(DEFAULT_PROJECT);
    setUnits([emptyRow()]);
    setSaveMsg("Project cleared.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const handleLoadDemo = () => {
    setProject(DEMO_PROJECT);
    setUnits(makeDemoUnits());
    setSaveMsg("Demo data loaded.");
    setTimeout(() => setSaveMsg(""), 3000);
  };

  const unitDiff = calc.unitDifference;
  const unitsMatch = project.expectedTotalUnits > 0 && unitDiff === 0;
  const unitsMissing = project.expectedTotalUnits > 0 && unitDiff < 0;
  const unitsOver = project.expectedTotalUnits > 0 && unitDiff > 0;

  return (
    <>
      {/* ── SCREEN VIEW (no-print) ───────────────────────────────────────── */}
      <div className="no-print">

        {/* Actions bar */}
        <div className="cb-actions-bar">
          <button className="cb-btn" type="button" onClick={handleSave}>Save Project</button>
          <button className="cb-btn cb-btn-secondary" type="button" onClick={handleLoad}>Load Saved</button>
          <button className="cb-btn cb-btn-secondary" type="button" onClick={handleLoadDemo}>Load Demo</button>
          <button className="cb-btn cb-btn-secondary" type="button" onClick={handleClear}>Clear</button>
          <button className="cb-btn cb-btn-secondary" type="button" onClick={() => exportCSV(project, calc)}>Export CSV</button>
          <button className="cb-btn cb-btn-secondary" type="button" onClick={() => window.print()}>Print / PDF</button>
          {saveMsg && <span className="cb-save-msg">{saveMsg}</span>}
        </div>

        {/* Unit check banner */}
        {project.expectedTotalUnits > 0 && (
          <div className={`cb-unit-banner ${unitsMatch ? "cb-unit-ok" : unitsMissing ? "cb-unit-warn" : "cb-unit-over"}`}>
            <strong>
              {unitsMatch && `✓ Units match. Expected ${project.expectedTotalUnits}, entered ${calc.enteredTotalUnits}.`}
              {unitsMissing && `⚠ Missing ${Math.abs(unitDiff)} unit${Math.abs(unitDiff) !== 1 ? "s" : ""}. Quote may be incomplete. Expected ${project.expectedTotalUnits}, entered ${calc.enteredTotalUnits}.`}
              {unitsOver && `⚠ ${unitDiff} unit${unitDiff !== 1 ? "s" : ""} over expected. Expected ${project.expectedTotalUnits}, entered ${calc.enteredTotalUnits}.`}
            </strong>
          </div>
        )}

        <div className="cb-layout">
          {/* ── Left: Project fields ── */}
          <aside className="tool-panel cb-aside">
            <h2 className="cb-section-title">Project Info</h2>

            <Field label="Project Name" value={project.projectName} onChange={(v) => patchProject({ projectName: v })} />
            <Field label="Builder Name" value={project.builderName} onChange={(v) => patchProject({ builderName: v })} />
            <Field label="Client Name" value={project.clientName} onChange={(v) => patchProject({ clientName: v })} />
            <Field label="Bid Date" type="date" value={project.bidDate} onChange={(v) => patchProject({ bidDate: v })} />
            <Field label="Product Line" value={project.productLine} onChange={(v) => patchProject({ productLine: v })} placeholder="e.g. Frameless" />

            <h2 className="cb-section-title" style={{ marginTop: 20 }}>Unit Count Check</h2>
            <NumField label="Expected Total Units" value={project.expectedTotalUnits} onChange={(v) => patchProject({ expectedTotalUnits: Math.floor(Math.max(0, v)) })} />
            <div className="cb-unit-mini">
              <span>Entered: <strong>{calc.enteredTotalUnits}</strong></span>
              <span>Diff: <strong style={{ color: unitDiff === 0 ? "var(--green)" : "var(--red)" }}>{unitDiff >= 0 ? "+" : ""}{unitDiff}</strong></span>
            </div>

            <h2 className="cb-section-title" style={{ marginTop: 20 }}>Costs &amp; Rates</h2>
            <NumField label="Installation Total ($)" value={project.installationTotal} onChange={(v) => patchProject({ installationTotal: v })} step={100} />
            <NumField label="Build Cost ($)" value={project.buildCost} onChange={(v) => patchProject({ buildCost: v })} step={100} />
            <NumField label="Shipping Cost ($)" value={project.shippingCost} onChange={(v) => patchProject({ shippingCost: v })} step={100} />
            <NumField label="Tax Rate decimal (e.g. 0.0792 = 7.92%)" value={project.taxRate} onChange={(v) => patchProject({ taxRate: v })} step={0.0001} />
            <NumField label="Handle Unit Cost ($)" value={project.handleUnitCost} onChange={(v) => patchProject({ handleUnitCost: v })} step={0.01} />

            <h2 className="cb-section-title" style={{ marginTop: 20 }}>General Specs</h2>
            <Field label="Door Material" value={project.doorMaterial} onChange={(v) => patchProject({ doorMaterial: v })} />
            <Field label="Box Material" value={project.boxMaterial} onChange={(v) => patchProject({ boxMaterial: v })} />
            <Field label="Shelves" value={project.shelfMaterial} onChange={(v) => patchProject({ shelfMaterial: v })} />
            <Field label="Hinge" value={project.hingeType} onChange={(v) => patchProject({ hingeType: v })} />
            <Field label="Drawer Runner" value={project.drawerRunner} onChange={(v) => patchProject({ drawerRunner: v })} />
            <Field label="Door Style" value={project.doorStyle} onChange={(v) => patchProject({ doorStyle: v })} />
          </aside>

          {/* ── Right: Unit rows + summary ── */}
          <section className="cb-main">

            {/* Unit type rows */}
            <div className="tool-panel" style={{ marginBottom: 18 }}>
              <div className="cb-rows-header">
                <h2 style={{ margin: 0 }}>Unit Types</h2>
                <button className="cb-btn" type="button" onClick={addRow}>+ Add Unit Type</button>
              </div>

              <div className="cb-table-scroll">
                <table className="cb-row-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Type *</th>
                      <th>Qty *</th>
                      <th>Unit Price ($)</th>
                      <th>Cabinets/Unit</th>
                      <th>HW/Unit</th>
                      <th>Notes</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {units.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <input
                            className="cb-cell-input"
                            value={row.product}
                            placeholder="Product"
                            onChange={(e) => patchRow(row.id, { product: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="cb-cell-input"
                            value={row.unitType}
                            placeholder="Unit Type"
                            onChange={(e) => patchRow(row.id, { unitType: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            className="cb-cell-input cb-num"
                            type="number"
                            min={0}
                            step={1}
                            value={row.quantity}
                            onChange={(e) => patchRow(row.id, { quantity: Math.floor(Math.max(0, Number(e.target.value) || 0)) })}
                          />
                        </td>
                        <td>
                          <input
                            className="cb-cell-input cb-num"
                            type="number"
                            min={0}
                            step={0.01}
                            value={row.unitPrice}
                            onChange={(e) => patchRow(row.id, { unitPrice: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </td>
                        <td>
                          <input
                            className="cb-cell-input cb-num"
                            type="number"
                            min={0}
                            step={1}
                            value={row.cabinetsPerUnit}
                            onChange={(e) => patchRow(row.id, { cabinetsPerUnit: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </td>
                        <td>
                          <input
                            className="cb-cell-input cb-num"
                            type="number"
                            min={0}
                            step={1}
                            value={row.hardwarePerUnit}
                            onChange={(e) => patchRow(row.id, { hardwarePerUnit: Math.max(0, Number(e.target.value) || 0) })}
                          />
                        </td>
                        <td>
                          <input
                            className="cb-cell-input"
                            value={row.notes}
                            placeholder="Notes"
                            onChange={(e) => patchRow(row.id, { notes: e.target.value })}
                          />
                        </td>
                        <td>
                          <div className="cb-row-actions">
                            <button type="button" className="cb-icon-btn" aria-label={`Duplicate row ${row.unitType || "unit"}`} title="Duplicate" onClick={() => duplicateRow(row.id)}>⧉</button>
                            <button type="button" className="cb-icon-btn cb-icon-danger" aria-label={`Remove row ${row.unitType || "unit"}`} title="Remove" onClick={() => removeRow(row.id)}>✕</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary table */}
            <div className="tool-panel">
              <h2 style={{ margin: "0 0 16px" }}>Cabinet Quote Summary</h2>

              <div className="cb-table-scroll">
                <table className="cb-summary-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Unit Type</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                      <th>Total Cabinets</th>
                      <th>Cabinet Hardware Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calc.rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.product}</td>
                        <td>{r.unitType || <span style={{ color: "var(--red)" }}>—</span>}</td>
                        <td className="cb-right">{r.quantity}</td>
                        <td className="cb-right">{exactMoney(r.unitPrice)}</td>
                        <td className="cb-right">{exactMoney(r.rowTotal)}</td>
                        <td className="cb-right">{r.rowTotalCabinets}</td>
                        <td className="cb-right">{r.rowHardwareCount}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="cb-totals-row">
                      <td></td>
                      <td><strong>Cabinets</strong></td>
                      <td className="cb-right"><strong>{calc.enteredTotalUnits}</strong></td>
                      <td></td>
                      <td className="cb-right"><strong>{exactMoney(calc.cabinetSubtotal)}</strong></td>
                      <td className="cb-right"><strong>{calc.totalCabinets}</strong></td>
                      <td className="cb-right"><strong>{calc.totalHardwareCount}</strong></td>
                    </tr>
                    <tr className="cb-sub-row">
                      <td colSpan={3}></td>
                      <td><strong>Handles</strong></td>
                      <td className="cb-right">{exactMoney(calc.handlesTotal)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="cb-sub-row">
                      <td colSpan={3}></td>
                      <td><strong>Build Cost</strong></td>
                      <td className="cb-right">{exactMoney(project.buildCost)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="cb-sub-row">
                      <td colSpan={3}></td>
                      <td><strong>Shipping</strong></td>
                      <td className="cb-right">{exactMoney(project.shippingCost)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="cb-sub-row">
                      <td colSpan={3}></td>
                      <td><strong>Tax ({(project.taxRate * 100).toFixed(2)}%)</strong></td>
                      <td className="cb-right">{exactMoney(calc.tax)}</td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="cb-sub-row">
                      <td colSpan={3}></td>
                      <td><strong>Total</strong></td>
                      <td className="cb-right"><strong>{exactMoney(calc.preInstallTotal)}</strong></td>
                      <td colSpan={2}></td>
                    </tr>
                    <tr className="cb-install-row">
                      <td colSpan={2}><strong>Cabinet Installation</strong></td>
                      <td colSpan={2} className="cb-right"><strong>Total</strong></td>
                      <td className="cb-right"><strong>{exactMoney(project.installationTotal)}</strong></td>
                      <td colSpan={2} style={{ color: "var(--muted)", fontSize: 12 }}>separate attachment</td>
                    </tr>
                    <tr className="cb-grand-row">
                      <td colSpan={4}><strong>Grand Total</strong></td>
                      <td className="cb-right"><strong>{exactMoney(calc.grandTotal)}</strong></td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Specs */}
              <div className="cb-specs">
                <div className="cb-specs-title">General Specifications</div>
                <div className="cb-specs-grid">
                  <div><span>A. Door Material:</span> {project.doorMaterial || "—"}</div>
                  <div><span>E. Drawer Runner:</span> {project.drawerRunner || "—"}</div>
                  <div><span>B. Box Material:</span> {project.boxMaterial || "—"}</div>
                  <div><span>E.1. Undermount softclose</span></div>
                  <div><span>C. Shelves:</span> {project.shelfMaterial || "—"}</div>
                  <div><span>G. Door Style:</span> {project.doorStyle || "—"}</div>
                  <div><span>D. Hinge:</span> {project.hingeType || "—"}</div>
                  <div></div>
                </div>
              </div>
            </div>

          </section>
        </div>
      </div>

      {/* ── PRINT VIEW ────────────────────────────────────────────────────── */}
      <div className="cb-print-view">
        <div className="cb-print-header">
          <div>
            <div className="cb-print-company">VIP CABINETS</div>
          </div>
          <div className="cb-print-project-title">{project.builderName || project.projectName || "Cabinet Bid"}</div>
          <div className="cb-print-meta">
            <div>Date: {project.bidDate}</div>
            <div>Product Line: {project.productLine}</div>
          </div>
        </div>

        <table className="cb-print-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Unit Type</th>
              <th>Qty</th>
              <th>Unit Price</th>
              <th>Total</th>
              <th>Total Cabinets</th>
              <th>Cabinet Hardware Count</th>
            </tr>
          </thead>
          <tbody>
            {calc.rows.map((r) => (
              <tr key={r.id}>
                <td>{r.product}</td>
                <td>{r.unitType}</td>
                <td style={{ textAlign: "right" }}>{r.quantity}</td>
                <td style={{ textAlign: "right" }}>$ {r.unitPrice.toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>$ {r.rowTotal.toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>{r.rowTotalCabinets}</td>
                <td style={{ textAlign: "right" }}>{r.rowHardwareCount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="cb-print-totals-row">
              <td></td>
              <td><strong>Cabinets</strong></td>
              <td style={{ textAlign: "right" }}><strong>{calc.enteredTotalUnits}</strong></td>
              <td></td>
              <td style={{ textAlign: "right" }}><strong>$ {calc.cabinetSubtotal.toFixed(2)}</strong></td>
              <td style={{ textAlign: "right" }}><strong>{calc.totalCabinets}</strong></td>
              <td style={{ textAlign: "right" }}><strong>{calc.totalHardwareCount}</strong></td>
            </tr>
            <tr><td></td><td><strong>Handles</strong></td><td></td><td></td><td style={{ textAlign: "right" }}>$ {calc.handlesTotal.toFixed(2)}</td><td></td><td></td></tr>
            <tr><td></td><td><strong>Build Cost</strong></td><td></td><td></td><td style={{ textAlign: "right" }}>$ {project.buildCost.toFixed(2)}</td><td></td><td></td></tr>
            <tr><td></td><td><strong>Shipping</strong></td><td></td><td></td><td style={{ textAlign: "right" }}>$ {project.shippingCost.toFixed(2)}</td><td></td><td></td></tr>
            <tr><td></td><td><strong>Tax</strong></td><td></td><td></td><td style={{ textAlign: "right" }}>$ {calc.tax.toFixed(2)}</td><td></td><td></td></tr>
            <tr><td></td><td><strong>Total</strong></td><td></td><td></td><td style={{ textAlign: "right" }}><strong>$ {calc.preInstallTotal.toFixed(2)}</strong></td><td></td><td></td></tr>
            <tr className="cb-print-install-row">
              <td colSpan={2}><strong>Cabinet Installation</strong></td>
              <td colSpan={2}><strong>Total</strong></td>
              <td style={{ textAlign: "right" }}><strong>$ {project.installationTotal.toFixed(2)}</strong></td>
              <td colSpan={2} style={{ fontSize: 10 }}>separate attachment</td>
            </tr>
            <tr className="cb-print-grand-row">
              <td colSpan={4}><strong>Grand Total</strong></td>
              <td style={{ textAlign: "right" }}><strong>$ {calc.grandTotal.toFixed(2)}</strong></td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>

        <div className="cb-print-specs">
          <table className="cb-print-specs-table">
            <tbody>
              <tr><td>1) General Specifications:</td><td></td></tr>
              <tr><td>A. Door Material: {project.doorMaterial}</td><td>E. Drawer runner: {project.drawerRunner}</td></tr>
              <tr><td>B. Box Material: {project.boxMaterial}</td><td>E.1. undermount softclose</td></tr>
              <tr><td>C. Shelves: {project.shelfMaterial}</td><td>G. Door style: {project.doorStyle}</td></tr>
              <tr><td>D. Hinge: {project.hingeType}</td><td></td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
