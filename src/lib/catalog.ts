import catalog from "@/data/vulpineMasterCatalog.json";

export type StyleName = "Framed" | "Frameless";

export type CatalogItem = {
  sku: string;
  description: string;
  category: string;
  style: StyleName;
  type: "cabinet" | "accessory";
  handleCount: number | null;
  prices: Record<string, number>;
};

export type MasterCatalog = {
  sourceWorkbook: string;
  sourceTabs: string[];
  defaults: {
    style: StyleName;
    finishByStyle: Record<StyleName, string>;
    priceMargin: number;
    discount: number;
    handlePrice: number;
    buildCostPerBox: number;
    shippingPerUnit: number;
    installCostPerBox: number;
    includeInstall: boolean;
  };
  factorModel: Record<StyleName, Record<string, number | string>>;
  styles: Record<
    StyleName,
    {
      finishes: string[];
      items: Record<string, CatalogItem>;
    }
  >;
};

export const masterCatalog = catalog as MasterCatalog;

export function masterFactor(style: StyleName, priceMargin: number) {
  if (style === "Frameless") {
    return 0.126 * (1 + priceMargin);
  }

  return 0.185 * (0.9 + priceMargin);
}

export function money(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function exactMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function allCatalogRows() {
  return (Object.keys(masterCatalog.styles) as StyleName[]).flatMap((style) =>
    Object.values(masterCatalog.styles[style].items).map((item) => ({
      ...item,
      finishes: Object.keys(item.prices),
    })),
  );
}
