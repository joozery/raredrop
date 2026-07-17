import { MetadataRoute } from "next";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

export const dynamic = "force-dynamic";

const APP_ICON = "/logoluxux.png";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  let siteName = "LuxusX";
  let siteDesc = "เปิดกล่องสุ่มสินค้าพรีเมียมออนไลน์ ลุ้นของสะสมสุดพิเศษ ราคาเริ่มต้นไม่กี่บาท";
  let titleSuffix: string = "กล่องสุ่มสินค้าพรีเมียม";

  try {
    await connectToDatabase();
    const [n, d, ts] = await Promise.all([
      Setting.findOne({ key: "site_name" }).lean(),
      Setting.findOne({ key: "site_description" }).lean(),
      Setting.findOne({ key: "site_title_suffix" }).lean(),
    ]);
    if ((n as any)?.value) siteName = (n as any).value;
    if ((d as any)?.value) siteDesc = (d as any).value;
    if ((ts as any)?.value !== undefined) titleSuffix = (ts as any).value;
  } catch {}

  return {
    name: titleSuffix ? `${siteName} - ${titleSuffix}` : siteName,
    short_name: siteName,
    description: siteDesc,
    start_url: "/",
    display: "standalone",
    background_color: "#F8F8F8",
    theme_color: "#dc2626",
    lang: "th",
    categories: ["shopping", "games", "entertainment"],
    icons: [
      { src: APP_ICON, sizes: "192x192", type: "image/png", purpose: "any" },
      { src: APP_ICON, sizes: "512x512", type: "image/png", purpose: "any" },
      { src: APP_ICON, sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
