import type { Metadata } from "next";
import Link from "next/link";
import HoloAuth from "@/components/HoloAuth";
import DeveloperEntry from "@/components/DeveloperEntry";
import "../admin/admin.css";

export const metadata: Metadata = {
  title: "Owner sign in",
  robots: { index: false, follow: false }
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export default function LoginPage() {
  return <DeveloperEntry><HoloAuth><section className="jb-auth-form">
    <p className="eyebrow">Developer options / owner access</p>
    <h1>Owner sign in</h1><p>Access is restricted to allowlisted accounts. Authenticator verification is required.</p>
    <a className="button button-primary" href={`${apiBase}/oauth2/authorization/google`}>Continue with Google</a>

    <Link className="button button-quiet" href="/">Return to launcher</Link>
  </section></HoloAuth></DeveloperEntry>;
}
