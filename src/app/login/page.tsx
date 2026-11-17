import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner sign in",
  robots: { index: false, follow: false }
};

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export default function LoginPage() {
  return (
    <main className="shell inner-page contact-page">
      <section className="page-intro">
        <p className="eyebrow"><span className="eyebrow-line" /> PRIVATE AREA / OWNER ACCESS</p>
        <h1>Sign in, <span>securely.</span></h1>
        <p>Portfolio administration is restricted to identities explicitly allowlisted by the owner. Signing in with an unapproved account does not grant access.</p>
      </section>
      <section className="contact-panel" aria-label="Sign-in providers">
        <div className="contact-panel-copy">
          <p className="eyebrow">AUTHENTICATION</p>
          <h2 className="about-heading">Choose an identity provider</h2>
          <p>Authentication uses OpenID Connect authorization-code flow, server-side sessions and an exact provider-subject allowlist.</p>
        </div>
        <div className="contact-panel-links">
          <a href={`${apiBase}/oauth2/authorization/google`}><span>CONTINUE WITH</span><strong>Google <i>↗</i></strong></a>
          <a href={`${apiBase}/oauth2/authorization/linkedin`}><span>CONTINUE WITH</span><strong>LinkedIn <i>↗</i></strong></a>
          <div className="contact-location"><span>ACCESS POLICY</span><strong>Owner allowlist only</strong></div>
        </div>
      </section>
    </main>
  );
}
