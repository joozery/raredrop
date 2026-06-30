import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/profile",
          "/purchases",
          "/inventory",
          "/topup-history",
          "/roll-history",
        ],
      },
    ],
    sitemap: "https://luxusx.com/sitemap.xml",
    host: "https://luxusx.com",
  };
}
