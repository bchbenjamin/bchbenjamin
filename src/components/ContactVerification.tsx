"use client";

import { useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "")).replace(/\/$/, "");

export default function ContactVerification({ token }: { token: string }) {
  const [message, setMessage] = useState(token ? "Confirm that you control this email address to complete your submission." : "This verification link is incomplete.");
  const [state, setState] = useState<"ready" | "loading" | "success" | "error">(token ? "ready" : "error");

  async function verify() {
    if (!token || state === "loading") return;
    setState("loading");
    setMessage("Verifying your email address…");
    try {
      const response = await fetch(`${apiBase}/api/v1/public/contact/verify?token=${encodeURIComponent(token)}`, {
        method: "POST", headers: { Accept: "application/json" }
      });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(result.message || "This link is invalid or has expired.");
      setMessage(result.message || "Your email address has been verified.");
      setState("success");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed.");
      setState("error");
    }
  }

  return <div className={`contact-verify-state is-${state}`} role="status"><span className="eyebrow">EMAIL VERIFICATION</span><h2>{state === "success" ? "Address confirmed." : state === "error" ? "Verification unavailable." : state === "loading" ? "One moment…" : "Confirm your address."}</h2><p>{message}</p>{state === "ready" && <button className="button button-primary" type="button" onClick={() => void verify()}>Confirm email address <span className="arrow-up-right">↗</span></button>}</div>;
}
