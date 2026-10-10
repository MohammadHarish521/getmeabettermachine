"use client";

import { useEffect, useState } from "react";
import { AMAZON_SALE_END, AMAZON_SALE_LABEL } from "@/config/sale";

type Remain = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function remainFrom(now: number): Remain {
  const ms = Math.max(0, AMAZON_SALE_END.getTime() - now);
  const total = Math.floor(ms / 1000);
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    done: total <= 0,
  };
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function SaleCountdown() {
  const [remain, setRemain] = useState<Remain | null>(null);

  useEffect(() => {
    const tick = () => setRemain(remainFrom(Date.now()));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!remain) {
    return (
      <span className="sale-timer" aria-hidden="true">
        <span className="sale-timer-label">{AMAZON_SALE_LABEL}</span>
        <span className="sale-timer-clock">--:--:--</span>
      </span>
    );
  }

  if (remain.done) {
    return <span className="sale-timer sale-timer-ended">Amazon sale ended</span>;
  }

  const clock = `${remain.days}d ${pad(remain.hours)}h ${pad(remain.minutes)}m ${pad(remain.seconds)}s`;

  return (
    <span
      className="sale-timer"
      title={`${AMAZON_SALE_LABEL} ${AMAZON_SALE_END.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })} IST`}
    >
      <span className="sale-timer-label">{AMAZON_SALE_LABEL}</span>
      <span className="sale-timer-clock" aria-label={clock}>
        <span className="sale-timer-part">
          <b>{remain.days}</b>
          <small>d</small>
        </span>
        <span className="sale-timer-part">
          <b>{pad(remain.hours)}</b>
          <small>h</small>
        </span>
        <span className="sale-timer-part">
          <b>{pad(remain.minutes)}</b>
          <small>m</small>
        </span>
        <span className="sale-timer-part sale-timer-seconds">
          <b>{pad(remain.seconds)}</b>
          <small>s</small>
        </span>
      </span>
    </span>
  );
}
