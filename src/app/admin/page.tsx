import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";

export const metadata: Metadata = {
  title: "Portfolio administration",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <main className="shell inner-page contact-page">
      <section className="page-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> PRIVATE AREA</p>
        <h1>Portfolio <span>workspace.</span></h1>
        <p>This area is protected by the backend owner session. Public site visitors cannot access administrative resources.</p>
      </section>
      <section className="contact-panel"><AdminGate /></section>
    </main>
  );
}
