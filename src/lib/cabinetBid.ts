// Pure calculation helpers for cabinet bid summary workflow

export type UnitRow = {
  id: string;
  product: string;
  unitType: string;
  quantity: number;
  unitPrice: number;
  cabinetsPerUnit: number;
  hardwarePerUnit: number;
  notes: string;
};

export type ProjectFields = {
  projectName: string;
  builderName: string;
  clientName: string;
  bidDate: string;
  productLine: string;
  expectedTotalUnits: number;
  doorMaterial: string;
  boxMaterial: string;
  drawerRunner: string;
  shelfMaterial: string;
  hingeType: string;
  doorStyle: string;
  installationTotal: number;
  buildCost: number;
  shippingCost: number;
  taxRate: number;
  handleUnitCost: number;
};

export type BidCalc = {
  rows: RowCalc[];
  enteredTotalUnits: number;
  unitDifference: number;
  cabinetSubtotal: number;
  totalCabinets: number;
  totalHardwareCount: number;
  handlesTotal: number;
  taxableSubtotal: number;
  tax: number;
  preInstallTotal: number;
  grandTotal: number;
};

export type RowCalc = {
  id: string;
  product: string;
  unitType: string;
  quantity: number;
  unitPrice: number;
  rowTotal: number;
  rowTotalCabinets: number;
  rowHardwareCount: number;
  notes: string;
};

export function calculateBid(project: ProjectFields, units: UnitRow[]): BidCalc {
  const rows: RowCalc[] = units.map((u) => ({
    id: u.id,
    product: u.product,
    unitType: u.unitType,
    quantity: u.quantity,
    unitPrice: u.unitPrice,
    rowTotal: u.quantity * u.unitPrice,
    rowTotalCabinets: u.quantity * u.cabinetsPerUnit,
    rowHardwareCount: u.quantity * u.hardwarePerUnit,
    notes: u.notes,
  }));

  const enteredTotalUnits = rows.reduce((s, r) => s + r.quantity, 0);
  const unitDifference = enteredTotalUnits - project.expectedTotalUnits;
  const cabinetSubtotal = rows.reduce((s, r) => s + r.rowTotal, 0);
  const totalCabinets = rows.reduce((s, r) => s + r.rowTotalCabinets, 0);
  const totalHardwareCount = rows.reduce((s, r) => s + r.rowHardwareCount, 0);
  const handlesTotal = totalHardwareCount * project.handleUnitCost;
  const taxableSubtotal = cabinetSubtotal + handlesTotal + project.buildCost + project.shippingCost;
  const tax = taxableSubtotal * project.taxRate;
  const preInstallTotal = taxableSubtotal + tax;
  const grandTotal = preInstallTotal + project.installationTotal;

  return {
    rows,
    enteredTotalUnits,
    unitDifference,
    cabinetSubtotal,
    totalCabinets,
    totalHardwareCount,
    handlesTotal,
    taxableSubtotal,
    tax,
    preInstallTotal,
    grandTotal,
  };
}

export function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const DEMO_PROJECT: ProjectFields = {
  projectName: "MT Builders",
  builderName: "MT Builders",
  clientName: "MT Builders",
  bidDate: "2024-01-15",
  productLine: "Frameless",
  expectedTotalUnits: 100,
  doorMaterial: "HDF",
  boxMaterial: "Plywood with maple finish",
  drawerRunner: "SOLID WOOD DOVETAILED / undermount softclose",
  shelfMaterial: "Plywood",
  hingeType: "DTC soft close",
  doorStyle: "Matte White",
  installationTotal: 187000,
  buildCost: 44000,
  shippingCost: 13350,
  taxRate: 0.0792,
  handleUnitCost: 2.87,
};

export function makeDemoUnits(): UnitRow[] {
  return [
    { id: uid(), product: "Frameless", unitType: "1A", quantity: 24, unitPrice: 6752.74, cabinetsPerUnit: 23, hardwarePerUnit: 53, notes: "" },
    { id: uid(), product: "", unitType: "1B1", quantity: 8, unitPrice: 5386.27, cabinetsPerUnit: 19, hardwarePerUnit: 42, notes: "" },
    { id: uid(), product: "", unitType: "1B2", quantity: 2, unitPrice: 5563.23, cabinetsPerUnit: 19, hardwarePerUnit: 45, notes: "" },
    { id: uid(), product: "", unitType: "1B3", quantity: 4, unitPrice: 5553.52, cabinetsPerUnit: 20, hardwarePerUnit: 45, notes: "" },
    { id: uid(), product: "", unitType: "1C", quantity: 9, unitPrice: 6462.84, cabinetsPerUnit: 21, hardwarePerUnit: 48, notes: "" },
    { id: uid(), product: "", unitType: "1D - TYPE A", quantity: 1, unitPrice: 6940.09, cabinetsPerUnit: 23, hardwarePerUnit: 54, notes: "" },
    { id: uid(), product: "", unitType: "2A1", quantity: 24, unitPrice: 8533.43, cabinetsPerUnit: 28, hardwarePerUnit: 66, notes: "" },
    { id: uid(), product: "", unitType: "2A2", quantity: 6, unitPrice: 8533.43, cabinetsPerUnit: 28, hardwarePerUnit: 66, notes: "" },
    { id: uid(), product: "", unitType: "2A3", quantity: 1, unitPrice: 8533.43, cabinetsPerUnit: 28, hardwarePerUnit: 66, notes: "" },
    { id: uid(), product: "", unitType: "2A3 - TYPE A", quantity: 1, unitPrice: 9069.35, cabinetsPerUnit: 31, hardwarePerUnit: 71, notes: "" },
    { id: uid(), product: "", unitType: "2B", quantity: 3, unitPrice: 8273.78, cabinetsPerUnit: 28, hardwarePerUnit: 65, notes: "" },
    { id: uid(), product: "", unitType: "2C1", quantity: 3, unitPrice: 8464.19, cabinetsPerUnit: 31, hardwarePerUnit: 70, notes: "" },
    { id: uid(), product: "", unitType: "2C2", quantity: 3, unitPrice: 8685.22, cabinetsPerUnit: 30, hardwarePerUnit: 69, notes: "" },
  ];
}

export const STORAGE_KEY = "cabinet_bid_v1";

export function validateProject(p: ProjectFields): string[] {
  const errors: string[] = [];
  if (p.expectedTotalUnits < 0 || !Number.isInteger(p.expectedTotalUnits))
    errors.push("Expected Total Units must be a non-negative integer.");
  if (p.buildCost < 0) errors.push("Build cost must be non-negative.");
  if (p.shippingCost < 0) errors.push("Shipping cost must be non-negative.");
  if (p.taxRate < 0 || p.taxRate > 1) errors.push("Tax rate must be between 0 and 1 (e.g. 0.074 for 7.4%).");
  if (p.installationTotal < 0) errors.push("Installation total must be non-negative.");
  if (p.handleUnitCost < 0) errors.push("Handle unit cost must be non-negative.");
  return errors;
}

export function validateRow(r: UnitRow): string[] {
  const errors: string[] = [];
  if (!r.unitType.trim()) errors.push(`Row ${r.unitType || "(blank)"}: Unit Type cannot be empty.`);
  if (r.quantity < 0 || !Number.isInteger(r.quantity)) errors.push(`Row "${r.unitType}": Quantity must be a non-negative integer.`);
  if (r.unitPrice < 0) errors.push(`Row "${r.unitType}": Unit Price must be non-negative.`);
  if (r.cabinetsPerUnit < 0) errors.push(`Row "${r.unitType}": Cabinets Per Unit must be non-negative.`);
  if (r.hardwarePerUnit < 0) errors.push(`Row "${r.unitType}": Hardware Per Unit must be non-negative.`);
  return errors;
}
