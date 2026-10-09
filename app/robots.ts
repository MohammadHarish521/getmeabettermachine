import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/", "/sponsor/mock"],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
