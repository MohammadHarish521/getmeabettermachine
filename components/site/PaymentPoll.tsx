"use client";

import { useEffect, useState } from "react";
import { formatUsd } from "@/lib/format";

type Payload = {
  payment: { id: string; status: string; amount: number };
  sponsor: { displayName: string; amount: number } | null;
};

export function PaymentPoll({ paymentId }: { paymentId: string | null }) {
  const [status, setStatus] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = paymentId
      ?.split(",")
      .map((part) => part.trim())
      .find((part) => part && !part.startsWith("pay_"));
    if (!id) {
      setError("Missing payment id.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const response = await fetch(`/api/payments/${id}`);
        const data = (await response.json()) as Payload & { error?: string };
        if (cancelled) return;
        if (!response.ok) {
          throw new Error(data.error || "Could not load payment.");
        }
        setStatus(data);
        setLoading(false);
        if (data.payment.status === "pending" && attempts < 40) {
          attempts += 1;
          window.setTimeout(poll, 1500);
        }
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Could not load payment.");
        setLoading(false);
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  return (
    <div className="mx-auto max-w-lg px-5 py-24 text-center">
      {loading && !status ? (
        <>
          <p className="text-[22px] font-medium tracking-[-0.03em]">Confirming payment…</p>
          <p className="mt-2 text-[14px] text-mute">
            Waiting for the charge to land. This page does not trust the redirect alone.
          </p>
        </>
      ) : null}

      {error ? (
        <>
          <h1 className="text-[28px] font-medium tracking-[-0.04em]">
            Could not confirm payment
          </h1>
          <p className="mt-2 text-[14px] text-mute">{error}</p>
        </>
      ) : null}

      {status?.payment.status === "pending" ? (
        <>
          <p className="text-[22px] font-medium tracking-[-0.03em]">Confirming payment…</p>
          <p className="mt-2 text-[14px] text-mute">Still waiting on the webhook.</p>
        </>
      ) : null}

      {status?.payment.status === "failed" ? (
        <>
          <h1 className="text-[28px] font-medium tracking-[-0.04em]">
            Payment didn’t go through
          </h1>
          <p className="mt-2 text-[14px] text-mute">
            Nothing was added to the machine. You can try again from the homepage.
          </p>
        </>
      ) : null}

      {status?.payment.status === "succeeded" ? (
        <>
          <p className="eyebrow">You’re on the wall</p>
          <h1 className="section-title mt-3">
            Thank you{status.sponsor ? `, ${status.sponsor.displayName}` : ""}.
          </h1>
          <p className="mt-3 text-[15px] text-mute">
            {formatUsd(status.payment.amount)} is now on the meter. The Mac just got closer.
          </p>
        </>
      ) : null}

      <a href="/" className="btn-secondary mt-8 inline-flex">
        Back to Raise My Mac
      </a>
    </div>
  );
}
