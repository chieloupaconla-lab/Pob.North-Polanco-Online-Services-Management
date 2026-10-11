import type { MetadataRoute } from "next";

const siteUrl = "https://pob-north-polanco-online-services-management-bb05z9zbs.vercel.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/documents", "/complaints", "/assets", "/info", "/contact", "/faqs", "/status"],
      disallow: [
        "/admin",
        "/admin/",
        "/api/",
        "/dashboard",
        "/dashboard/",
        "/notifications",
        "/documents/status",
        "/archive",
        "/activity-log",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
