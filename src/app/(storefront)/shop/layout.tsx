import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ร้านค้า - ซื้อสินค้า",
  description: "ร้านค้าออนไลน์ สินค้าพรีเมียมมือสอง ของสะสมหายาก ราคาถูกกว่าตลาด จากผู้เล่นที่ได้รับจากกล่องสุ่ม",
  alternates: { canonical: "https://luxusx.com/shop" },
  openGraph: {
    title: "ร้านค้า - ซื้อสินค้า | LuxusX",
    description: "ร้านค้าออนไลน์ สินค้าพรีเมียมมือสอง ของสะสมหายาก ราคาถูกกว่าตลาด",
    url: "https://luxusx.com/shop",
    type: "website",
  },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
