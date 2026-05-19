import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vulpine Bids",
  description: "Cabinet price sheets and bid dashboard built from the Vulpine master catalog.",
  icons: {
    icon: "/brand/vulpine-logo.svg",
    shortcut: "/brand/vulpine-logo.svg",
    apple: "/brand/shield.png",
  },
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
              <span className="brand-mark image-mark">
                <Image src="/brand/shield.png" alt="" width={44} height={44} priority />
              </span>
              <span>
                Vulpine <em>Bid Engine</em>
              </span>
            </Link>
            <nav className="nav" aria-label="Main navigation">
              <Link href="/cabinet-bid">Cabinet Bid</Link>
              <Link href="/price-sheets">Price Sheets</Link>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/how-to-use">How To Use</Link>
            </nav>
          </div>
        </div>
        {children}
      </body>
    </html>
  );
}
