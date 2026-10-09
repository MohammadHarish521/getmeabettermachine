"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/format";

export default function MockCheckoutPage() {
  const params = useParams<{ paymentId: string }>();
  const router = useRouter();
  const paymentId = params.paymentId;
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/payments/${paymentId}`)
      .then(async (response) => {
        const data = (await response.json()) as {
          payment?: { amount: number; provider: string };
          error?: string;
        };
        if (cancelled) return;
        if (!response.ok) throw new Error(data.error || "Payment not found.");
        setAmount(data.payment?.amount ?? null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Payment not found.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  async function confirm() {
    setPending(true);
    const response = await fetch(`/api/payments/${paymentId}/mock-confirm`, {
      method: "POST",
    });
    if (!response.ok) {
      const data = (await response.json()) as { error?: string };
      setError(data.error || "Could not confirm.");
      setPending(false);
      return;
    }
    router.push(`/sponsor/success?payment_id=${paymentId}`);
  }

  async function fail() {
    setPending(true);
    await fetch(`/api/payments/${paymentId}/mock-fail`, { method: "POST" });
    router.push("/sponsor/cancel");
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-5">
      <p className="text-[11px] tracking-[0.16em] text-mute uppercase">
        Local mock checkout
      </p>
      <h1 className="mt-3 text-[32px] font-medium tracking-[-0.04em]">
        Test payment
      </h1>
      <p className="mt-3 text-[15px] text-mute">
        Dodo is not configured. This page stands in for the hosted checkout.
      </p>
      {amount !== null ? (
        <p className="mt-6 text-[28px] font-medium tracking-[-0.04em] tabular-nums">
          {formatUsd(amount)}
        </p>
      ) : null}
      {error ? <p className="mt-4 text-[13px] text-red-700">{error}</p> : null}
      <div className="mt-8 flex gap-3">
        <button type="button" className="btn-primary" onClick={confirm} disabled={pending}>
          Pay
        </button>
        <button type="button" className="btn-secondary" onClick={fail} disabled={pending}>
          Cancel
        </button>
      </div>
    </div>
  );
}
