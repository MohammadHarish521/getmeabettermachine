import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: getAppUrl(),
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1,
    },
    {
      url: `${getAppUrl()}/terms`,
      lastModified: new Date("2026-10-10"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
