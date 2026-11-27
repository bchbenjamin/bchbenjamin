import HoloAuth from "@/components/HoloAuth";
import type { Metadata } from "next";
import ContactVerification from "@/components/ContactVerification";

export const metadata: Metadata = { title: "Verify contact email", robots: { index: false, follow: false } };

export default async function VerifyContactPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams;
  return <HoloAuth title="Verify email"><ContactVerification token={params.token ?? ""} /></HoloAuth>;
}
