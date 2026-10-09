"use client";

import { useEffect, useState } from "react";
import { letterLogo } from "@/lib/format";
import { siteIconPath } from "@/lib/urls";

export function SiteLogo({
  name,
  siteUrl,
  src,
  className,
}: {
  name: string;
  siteUrl?: string | null;
  src?: string;
  className?: string;
}) {
  const fallback = src?.startsWith("data:") ? src : letterLogo(name);
  const icon = siteUrl
    ? siteIconPath(siteUrl)
    : src && !src.startsWith("data:")
      ? src
      : "";
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [siteUrl, src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={!failed && icon ? icon : fallback}
      alt=""
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
