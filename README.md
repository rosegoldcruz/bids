# Vulpine Bids

Next.js App Router project for Vulpine cabinet price sheets and bidding.

## Pages

- `/` command center with large CTAs
- `/price-sheets` searchable master-derived product sheets
- `/dashboard` bid dashboard using master factor logic

## Data Source

`src/data/vulpineMasterCatalog.json` was extracted from the Multi-Family Master Sheet tabs:

- Framed Catalog List Price
- Framed Accessory List Price
- Frameless Catalog List Price
- Frameless Accessory List Price

## Master Factor Logic

- Framed: `factor = 0.185 * (0.9 + priceMargin)`
- Frameless: `factor = 0.126 * (1 + priceMargin)`
