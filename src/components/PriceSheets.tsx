"use client";

import { useMemo, useState } from "react";
import { allCatalogRows, exactMoney, masterCatalog, type CatalogItem, type StyleName } from "@/lib/catalog";

export function PriceSheets() {
  const [query, setQuery] = useState("");
  const [style, setStyle] = useState<"All" | StyleName>("All");
  const [finish, setFinish] = useState("All");

  const finishes = useMemo(
    () => Array.from(new Set(Object.values(masterCatalog.styles).flatMap((entry) => entry.finishes))).sort(),
    [],
  );

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allCatalogRows()
      .filter((row) => style === "All" || row.style === style)
      .filter((row) => finish === "All" || row.prices[finish] !== undefined)
      .filter((row) => {
        if (!needle) return true;
        return `${row.sku} ${row.description} ${row.category} ${row.style} ${row.type}`.toLowerCase().includes(needle);
      })
      .slice(0, 500);
  }, [finish, query, style]);

  return (
    <>
      <div className="loud-strip">
        <div>
          <strong>EMPLOYEES: CLICK HERE FOR CABINET PRODUCT PRICES.</strong>
          <p className="source-note">
            This is the master-derived HTML catalog. Do not treat the brochure PDF as the full pricing guide.
          </p>
        </div>
        <a className="button" href="/dashboard">
          Open Bidding Dashboard
        </a>
      </div>

      <div className="catalog-toolbar">
        <input
          className="catalog-search"
          placeholder="Search SKU, description, category..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <select className="catalog-search" value={style} onChange={(event) => setStyle(event.target.value as "All" | StyleName)}>
          <option value="All">All styles</option>
          <option value="Framed">Framed</option>
          <option value="Frameless">Frameless</option>
        </select>
        <select className="catalog-search" value={finish} onChange={(event) => setFinish(event.target.value)}>
          <option value="All">All finishes</option>
          {finishes.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      <div className="catalog-shell">
        <div className="catalog-summary">
          <span>
            Showing <strong>{rows.length}</strong> rows
          </span>
          <span>
            Framed items <strong>{Object.keys(masterCatalog.styles.Framed.items).length}</strong>
          </span>
          <span>
            Frameless items <strong>{Object.keys(masterCatalog.styles.Frameless.items).length}</strong>
          </span>
          <span>Source: Multi-Family Master Sheet</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Description</th>
                <th>Style</th>
                <th>Type</th>
                <th>Category</th>
                <th>Prices</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <CatalogRow key={`${row.style}-${row.sku}`} row={row} finish={finish} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function CatalogRow({ row, finish }: { row: CatalogItem; finish: string }) {
  const priceEntries =
    finish === "All"
      ? Object.entries(row.prices).slice(0, 8)
      : Object.entries(row.prices).filter(([name]) => name === finish);

  return (
    <tr>
      <td>{row.sku}</td>
      <td>{row.description}</td>
      <td>{row.style}</td>
      <td>{row.type}</td>
      <td>{row.category}</td>
      <td>
        {priceEntries.map(([name, value]) => (
          <div key={name}>
            <strong>{name}:</strong> {exactMoney(value)}
          </div>
        ))}
      </td>
    </tr>
  );
}
