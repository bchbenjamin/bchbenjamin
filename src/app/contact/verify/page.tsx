import type { Metadata } from "next";
import ContactVerification from "@/components/ContactVerification";

export const metadata: Metadata = { title: "Verify contact email", robots: { index: false, follow: false } };

export default async function VerifyContactPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <section className="shell inner-page contact-page"><div className="page-intro"><p className="eyebrow"><span className="eyebrow-line" /> CONTACT / VERIFY</p><h1>Confirm your <span>email address.</span></h1></div><div className="contact-panel"><ContactVerification token={params.token ?? ""} /></div></section>;
}
