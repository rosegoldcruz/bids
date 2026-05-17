import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vulpine Bids",
  description: "Cabinet price sheets and bid dashboard built from the Vulpine master catalog.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="topbar">
          <div className="shell topbar-inner">
            <Link className="brand" href="/">
              <span className="brand-mark">V</span>
              <span>
                Vulpine <em>Bid Engine</em>
              </span>
            </Link>
            <nav className="nav" aria-label="Main navigation">
              <Link href="/price-sheets">Price Sheets</Link>
              <Link href="/dashboard">Dashboard</Link>
            </nav>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
