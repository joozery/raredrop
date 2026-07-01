import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "LuxusX";
  let siteDesc = "เปิดกล่องสุ่มสินค้าพรีเมียมออนไลน์ ลุ้นของสะสมสุดพิเศษ ราคาเริ่มต้นไม่กี่บาท";
  let logoUrl = "/apple-touch-icon.png";

  try {
    await connectToDatabase();
    const [n, d, l] = await Promise.all([
      Setting.findOne({ key: "site_name" }).lean(),
      Setting.findOne({ key: "site_description" }).lean(),
      Setting.findOne({ key: "site_logo" }).lean(),
    ]);
    if ((n as any)?.value) siteName = (n as any).value;
    if ((d as any)?.value) siteDesc = (d as any).value;
    if ((l as any)?.value) logoUrl = (l as any).value;
  } catch {}

  const isJpeg = logoUrl.endsWith(".jpg") || logoUrl.endsWith(".jpeg");
  const mimeType = isJpeg ? "image/jpeg" : "image/png";

  const icons: MetadataRoute.Manifest["icons"] = [
    { src: logoUrl, sizes: "192x192", type: mimeType },
    { src: logoUrl, sizes: "512x512", type: mimeType, purpose: "maskable" },
  ];

  return {
    name: `${siteName} - กล่องสุ่มสินค้าพรีเมียม`,
    short_name: siteName,
    description: siteDesc,
    start_url: "/",
    display: "standalone",
    background_color: "#F8F8F8",
    theme_color: "#dc2626",
    lang: "th",
    categories: ["shopping", "games", "entertainment"],
    icons,
  };
}
