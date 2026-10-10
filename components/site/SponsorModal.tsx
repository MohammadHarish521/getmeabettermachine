"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ensureDataFast } from "@/lib/datafast";
import { formatUsd } from "@/lib/format";
import { ALL_SPOTS_ID, SURFACE_LABEL } from "@/config/spots";
import { SiteLogo } from "@/components/site/SiteLogo";
import type { PublicSpot } from "@/lib/types";

export function SponsorModal({
  open,
  onClose,
  spots,
  spotId,
  onPickSpot,
}: {
  open: boolean;
  onClose: () => void;
  spots: PublicSpot[];
  spotId: string | null;
  onPickSpot: (id: string) => void;
}) {
  const takeAll = spotId === ALL_SPOTS_ID;
  const spot = takeAll ? null : spots.find((item) => item.id === spotId) ?? null;
  const allTotal = spots.reduce((sum, item) => sum + item.nextPrice, 0);
  const takenCount = spots.filter((item) => item.occupant).length;
  const anyHeld = spots.some((item) => item.held);
  const [website, setWebsite] = useState("");
  const [preview, setPreview] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstField.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      setWebsite("");
      setPreview("");
      setError(null);
      setPending(false);
    }
  }, [open, spotId]);

  useEffect(() => {
    const value = website.trim();
    if (!value) {
      setPreview("");
      return;
    }
    const timer = window.setTimeout(() => {
      setPreview(value);
      const params = new URLSearchParams({ u: value });
      void fetch(`/api/listing-meta?${params}`).catch(() => {});
    }, 400);
    return () => window.clearTimeout(timer);
  }, [website]);

  if (!open) return null;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const order = takeAll
      ? { spotId: ALL_SPOTS_ID, amount: allTotal }
      : spot
        ? { spotId: spot.id, amount: spot.nextPrice }
        : null;
    if (!order) {
      setError("Pick a spot on the machine first.");
      return;
    }
    setError(null);
    setPending(true);
    try {
      await ensureDataFast();
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...order, website }),
      });
      const data = (await response.json()) as {
        checkoutUrl?: string;
        error?: string;
      };
      if (!response.ok || !data.checkoutUrl) {
        throw new Error(data.error || "Could not start checkout.");
      }
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setPending(false);
    }
  }

  return (
    <div className="dialog-scrim" onClick={onClose} role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute inset-x-0 bottom-0 mx-auto max-h-[92dvh] overflow-y-auto rounded-t-2xl border border-line bg-elevated p-5 shadow-[0_-20px_80px_rgba(23,22,20,0.12)] sm:inset-auto sm:top-1/2 sm:left-1/2 sm:w-full sm:max-w-[480px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Placement</p>
            <h2 id={titleId} className="mt-1 text-xl font-semibold">
              {takeAll ? "All spots" : spot ? spot.name : "Pick a spot"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-mute hover:text-ink"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {!spot && !takeAll ? (
          <ul className="mt-5 space-y-2">
            {spots.length > 1 ? (
              <li>
                <button
                  type="button"
                  className={
                    anyHeld
                      ? "flex w-full items-center justify-between rounded-xl border border-[#c98900] bg-[#fff6e0] px-3 py-3 text-left"
                      : "flex w-full items-center justify-between rounded-xl border border-blue bg-blue-soft px-3 py-3 text-left transition-colors hover:bg-blue hover:text-white [&:hover_span]:text-white"
                  }
                  disabled={anyHeld}
                  onClick={() => onPickSpot(ALL_SPOTS_ID)}
                >
                  <span className={anyHeld ? "font-medium text-[#8a5a00]" : "font-medium text-blue"}>
                    {anyHeld ? "Someone is checking out" : `Take all ${spots.length} spots`}
                    <span
                      className={
                        anyHeld
                          ? "mt-0.5 block text-[12px] font-normal text-[#8a5a00]/80"
                          : "mt-0.5 block text-[12px] font-normal text-blue/80"
                      }
                    >
                      {anyHeld
                        ? "Wait a few minutes if they don’t finish."
                        : "Every sticker in one checkout"}
                    </span>
                  </span>
                  {anyHeld ? null : (
                    <span className="text-[14px] font-semibold tabular-nums text-blue">
                      {formatUsd(allTotal)}
                    </span>
                  )}
                </button>
              </li>
            ) : null}
            {spots.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={
                    item.held
                      ? "flex w-full items-center justify-between rounded-xl border border-[#c98900] bg-[#fff6e0] px-3 py-3 text-left"
                      : "flex w-full items-center justify-between rounded-xl border border-line px-3 py-3 text-left hover:border-line-strong"
                  }
                  disabled={item.held}
                  onClick={() => onPickSpot(item.id)}
                >
                  <span>
                    <span className="mr-2 text-mute tabular-nums">{item.number}</span>
                    {item.name}
                    <span className="mt-0.5 block text-[12px] text-dim">
                      {item.held
                        ? "Someone is checking out"
                        : SURFACE_LABEL[item.surface]}
                    </span>
                  </span>
                  <span
                    className={
                      item.held
                        ? "text-[13px] font-medium text-[#8a5a00]"
                        : "text-[13px] tabular-nums text-mute"
                    }
                  >
                    {item.held ? "Checking out" : formatUsd(item.nextPrice)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={submit}>
            {takeAll ? (
              <>
                <p className="text-[14px] leading-6 text-mute">
                  Every sticker on the machine: the top, front, back, the power cable and the
                  Magic Mouse. One checkout, one logo on all of them.
                </p>
                <p className="text-2xl font-semibold text-green tabular-nums">
                  {formatUsd(allTotal)}
                  <span className="ml-2 text-[13px] font-normal text-mute">
                    for {spots.length} spots
                    {takenCount > 0
                      ? ` · ${takenCount} taken, counted at 1.5×`
                      : ""}
                  </span>
                </p>
                {anyHeld ? (
                  <p className="checkout-hold-note">
                    Someone is checking out a spot right now. Try again in a few minutes.
                  </p>
                ) : null}
              </>
            ) : spot ? (
              <>
                <p className="text-[14px] leading-6 text-mute">{spot.description}</p>
                {spot.held ? (
                  <p className="checkout-hold-note">
                    Someone is checking out this spot right now. Try again in a few minutes.
                  </p>
                ) : null}
                <p className="text-2xl font-semibold text-green tabular-nums">
                  {formatUsd(spot.nextPrice)}
                  {spot.occupant ? (
                    <span className="ml-2 text-[13px] font-normal text-mute">
                      to take over {spot.occupant.displayName}
                    </span>
                  ) : null}
                </p>
              </>
            ) : null}

            <label className="block">
              <span className="text-[12px] text-mute">Your URL</span>
              <div className="mt-1.5 flex items-center gap-3">
                {preview ? (
                  <SiteLogo
                    name={preview}
                    siteUrl={preview}
                    className="h-11 w-11 shrink-0 rounded-xl border border-line bg-white object-contain p-1"
                  />
                ) : null}
                <input
                  ref={firstField}
                  className="field"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  placeholder="yoursite.com or @handle"
                  autoComplete="url"
                  inputMode="url"
                  required
                />
              </div>
              <span className="mt-1.5 block text-[12px] text-dim">
                Logo, name, and link come from the site.
              </span>
            </label>

            {error ? <p className="text-[13px] text-red-700">{error}</p> : null}

            <p className="text-[12px] leading-5 text-dim">
              By paying you agree to the{" "}
              <a className="text-link" href="/terms" target="_blank" rel="noopener noreferrer">
                terms
              </a>
              . No illegal activity and no adult content.
            </p>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={
                pending ||
                !website.trim() ||
                (takeAll && anyHeld) ||
                Boolean(spot?.held)
              }
            >
              {pending
                ? "Starting checkout…"
                : takeAll
                  ? `Take all ${spots.length} spots`
                  : `Take ${spot?.name ?? "this spot"}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
