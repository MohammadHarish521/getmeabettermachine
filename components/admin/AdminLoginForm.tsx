"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Wordmark } from "@/components/site/Wordmark";

export function AdminLoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(data.error || "Could not log in.");
      setPending(false);
      return;
    }
    router.push(params.get("next") || "/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-5">
      <Wordmark />
      <h1 className="mt-8 text-[28px] font-medium tracking-[-0.04em]">Admin</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <label className="block text-[12px] text-mute">
          Password
          <input
            className="field mt-1.5"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="text-[13px] text-red-700">{error}</p> : null}
        <button type="submit" className="btn-primary w-full" disabled={pending}>
          {pending ? "Checking…" : "Enter"}
        </button>
      </form>
    </div>
  );
}
