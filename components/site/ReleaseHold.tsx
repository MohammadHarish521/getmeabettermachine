"use client";

import { useEffect } from "react";

export function ReleaseHold({ paymentId }: { paymentId: string | null }) {
  useEffect(() => {
    if (!paymentId) return;
    void fetch(`/api/payments/${encodeURIComponent(paymentId)}/release`, {
      method: "POST",
    }).catch(() => {});
  }, [paymentId]);
  return null;
}
