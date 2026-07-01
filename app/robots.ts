import type { MetadataRoute } from "next"
import { getSiteUrl } from "@/lib/utils/site-url"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl()
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/dashboard", "/account", "/api/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
