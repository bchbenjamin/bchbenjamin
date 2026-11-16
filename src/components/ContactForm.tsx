"use client";

import { FormEvent, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || (process.env.NODE_ENV === "development" ? "http://localhost:8080" : "")).replace(/\/$/, "");

export default function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch(`${apiBase}/api/v1/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) throw new Error(result.message || (response.status === 429 ? "Too many attempts. Please wait before trying again." : "Your message could not be submitted. Please try again later."));
      form.reset();
      setStatus({ kind: "success", text: result.message || "If your submission passes screening, you'll receive an email verification link." });
    } catch (error) {
      setStatus({ kind: "error", text: error instanceof Error ? error.message : "Submission failed. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
      <div className="contact-form-grid">
        <label>Name<input name="name" autoComplete="name" minLength={2} maxLength={160} required placeholder="Your name" /></label>
        <label>Organisation <span>(optional)</span><input name="organization" autoComplete="organization" maxLength={180} placeholder="Company or organisation" /></label>
        <label>Email address<input name="email" type="email" autoComplete="email" maxLength={320} required placeholder="you@example.com" /></label>
        <label>Subject<input name="subject" maxLength={180} minLength={3} required placeholder="What would you like to discuss?" /></label>
        <label className="contact-form-message">Message<textarea name="message" minLength={20} maxLength={5000} rows={7} required placeholder="A little context helps me understand your enquiry…" /></label>
      </div>
      <label className="contact-honeypot" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <p className="contact-form-privacy">Your name, contact details and message are processed by the configured AI screening provider and stored for up to 180 days. Email verification confirms mailbox control, not real-world identity.</p>
      <div className="contact-form-footer">
        <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit enquiry"} <span className="arrow-up-right">↗</span></button>
        {status && <p className={`contact-form-status is-${status.kind}`} role="status">{status.text}</p>}
      </div>
    </form>
  );
}
