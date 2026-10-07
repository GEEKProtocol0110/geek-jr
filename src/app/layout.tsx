import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";
import DisclosureLinks from "@/modules/common/DisclosureLinks";

const assetBasePath = process.env.GITHUB_PAGES === "true" && process.env.GEEK_JR_CUSTOM_DOMAIN !== "geekjr.xyz" ? "/geek-jr" : "";

export const metadata: Metadata = {
  title: { default: "Geek Jr | Learn through play", template: "%s | Geek Jr" },
  description: "Six thoughtful early-learning activities for ages 1–10, from Geek Protocol.",
  icons: { icon: `${assetBasePath}/favicon.svg` },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="site-brand" aria-label="Geek Jr home">
              <Image src={`${assetBasePath}/geek-protocol-logo.png`} width={44} height={44} alt="" className="brand-icon" />
              <span className="brand-wordmark">GEEK<span>JR.</span><small>BY GEEK PROTOCOL</small></span>
            </Link>
            <nav aria-label="Main navigation" className="site-nav">
              <Link href="/#activities">Play</Link>
              <Link href="/parent" className="nav-parent">For grown-ups <span aria-hidden="true">↗</span></Link>
            </nav>
          </div>
        </header>
        <DisclosureLinks />
        {children}
        <footer className="site-footer">
          <span>GEEK JR. <small>BY GEEK PROTOCOL</small></span>
          <p>Little questions. Big curiosity.</p>
          <a href="https://geekprotocol.xyz" target="_blank" rel="noreferrer">Geek Protocol HQ · for older explorers <span aria-hidden="true">↗</span></a>
        </footer>
      </body>
    </html>
  );
}
