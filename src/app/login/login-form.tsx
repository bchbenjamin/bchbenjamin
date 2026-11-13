"use client";

import { useActionState } from "react";

import { signInAction, type SignInState } from "./actions";

const initialState: SignInState = { error: null };

const field =
  "mt-2 w-full border border-line bg-card px-3 py-2.5 text-sm text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />

      <div>
        <label
          htmlFor="email"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={field}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-fg-faint"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={12}
          className={field}
        />
      </div>

      {state.error ? (
        <p
          role="alert"
          className="border-l border-accent pl-3 text-sm text-fg-muted"
        >
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full border border-line px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-fg transition-colors hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
