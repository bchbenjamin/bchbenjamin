"use client";

import { useEffect, useState } from "react";

const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/$/, "");

export default function LogoutButton() {
  const [csrf, setCsrf] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/v1/csrf`, { credentials: "include" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Unable to initialise logout")))
      .then((payload: { token: string }) => setCsrf(payload.token))
      .catch(() => setCsrf(""));
  }, []);

  return (
    <form action={`${apiBase}/logout`} method="post">
      <input type="hidden" name="_csrf" value={csrf} />
      <button className="button button-quiet" type="submit" disabled={!csrf}>Sign out <span className="arrow-up-right">↗</span></button>
    </form>
  );
}
