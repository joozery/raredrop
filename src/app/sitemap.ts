import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";

const BASE = "https://luxusx.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: BASE,                         lastModified: new Date(), changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/boxes`,              lastModified: new Date(), changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/shop`,               lastModified: new Date(), changeFrequency: "daily",   priority: 0.85 },
    { url: `${BASE}/marketplace`,        lastModified: new Date(), changeFrequency: "daily",   priority: 0.8 },
    { url: `${BASE}/leaderboard`,        lastModified: new Date(), changeFrequency: "hourly",  priority: 0.75 },
    { url: `${BASE}/red-envelope`,       lastModified: new Date(), changeFrequency: "daily",   priority: 0.7 },
    { url: `${BASE}/exchange`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.6 },
    { url: `${BASE}/knowledge-base`,     lastModified: new Date(), changeFrequency: "monthly", priority: 0.55 },
    { url: `${BASE}/help`,               lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  try {
    await connectToDatabase();
    const boxes = await Box.find({}).select("_id updatedAt").lean();
    const boxPages: MetadataRoute.Sitemap = boxes.map((box: any) => ({
      url: `${BASE}/boxes/${box._id}`,
      lastModified: box.updatedAt || new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
    return [...staticPages, ...boxPages];
  } catch {
    return staticPages;
  }
}
