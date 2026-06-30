import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LuxusX - กล่องสุ่มสินค้าพรีเมียม",
    short_name: "LuxusX",
    description: "เปิดกล่องสุ่มสินค้าพรีเมียมออนไลน์ ลุ้นของสะสมสุดพิเศษ ราคาเริ่มต้นไม่กี่บาท",
    start_url: "/",
    display: "standalone",
    background_color: "#F8F8F8",
    theme_color: "#dc2626",
    lang: "th",
    categories: ["shopping", "games", "entertainment"],
    icons: [
      { src: "/logo/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo/logo.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
