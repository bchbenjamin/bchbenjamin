import type { Metadata } from "next";
import AdminGate from "@/components/AdminGate";

export const metadata: Metadata = {
  title: "Portfolio administration",
  robots: { index: false, follow: false }
};

export default function AdminPage() {
  return (
    <main className="shell inner-page contact-page">
      <section className="contact-panel admin-workspace-panel"><AdminGate /></section>
    </main>
  );
}
