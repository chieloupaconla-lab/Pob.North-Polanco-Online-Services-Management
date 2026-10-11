import type { MetadataRoute } from "next";

const siteUrl = "https://pob-north-polanco-online-services-management-bb05z9zbs.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = ["/", "/documents", "/complaints", "/assets", "/info", "/contact", "/faqs", "/status"];
  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : 0.7,
  }));
}
