import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy for families",
  description: "Geek Jr has no accounts, no analytics and no backend. Learner progress stays in this browser.",
};

export default function PrivacyPage() {
  return (
    <main id="main-content" className="activity-page">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="back-link">← Geek Jr home</Link>
        <p className="eyebrow">FOR GROWN-UPS</p>
        <h1 className="text-3xl font-bold mt-2">Privacy for families</h1>
        <p className="mt-4">Effective November 19, 2026. Geek Jr is a free early-learning site for ages 1–10, made by Geek Protocol.</p>

        <div className="family-note" style={{ display: "block" }}>
          <h2>The short version</h2>
          <p>There are no accounts, no sign-in, no analytics, no ads and no chat. We do not collect your child&apos;s name, age, voice or progress on our servers. Everything Geek Jr saves stays in this browser on this device.</p>
        </div>

        <h2 className="text-xl font-bold mt-8">What is saved, and where</h2>
        <p className="mt-2">This browser&apos;s local storage keeps up to eight learner nicknames, age ranges, grown-up preferences, card practice, game totals, and the word and reading observations you record. Nothing is sent to Geek Protocol. Clearing this site&apos;s data in your browser removes it.</p>

        <h2 className="text-xl font-bold mt-8">Backups you download</h2>
        <p className="mt-2">The <Link href="/parent">For grown-ups</Link> page can download a backup file. It is created on your device and is never uploaded. Importing a backup also happens only on your device. Keep backup files private.</p>

        <h2 className="text-xl font-bold mt-8">Microphone, speech and video</h2>
        <p className="mt-2">Geek Jr never uses the microphone, makes recordings or scores speech. Read-aloud uses your device&apos;s own built-in voices. No third-party video is embedded.</p>

        <h2 className="text-xl font-bold mt-8">Hosting and outside links</h2>
        <p className="mt-2">Like any website, our hosting provider (GitHub Pages) receives standard request details such as your IP address when the site loads. Links to Geek Protocol HQ, Oxford Owl and IES open those services only when tapped, and no learner records are included. Those sites have their own privacy policies; Geek Protocol HQ is meant for ages 13 and up.</p>

        <h2 className="text-xl font-bold mt-8">Learning reward plan</h2>
        <p className="mt-2">The optional reward plan only shows proposed amounts for grown-ups to review. It creates no balance, payment, wallet or account, and sends nothing anywhere.</p>

        <h2 className="text-xl font-bold mt-8">Changes and contact</h2>
        <p className="mt-2">If Geek Jr ever adds accounts, analytics or anything that sends a child&apos;s information to a server, this page will be updated first. Questions: email <strong>geek.coin.protocol@gmail.com</strong>.</p>
      </div>
    </main>
  );
}
