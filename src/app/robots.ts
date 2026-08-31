import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/s/"],
        disallow: [
          "/admin",
          "/dashboard",
          "/analytics",
          "/create-link",
          "/my-links",
          "/profile",
          "/settings",
          "/login",
          "/register",
          "/forgot-password",
          "/api/"
        ]
      }
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL
  };
}
