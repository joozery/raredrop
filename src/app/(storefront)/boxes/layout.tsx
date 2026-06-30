import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "กล่องสุ่มทั้งหมด",
  description: "เลือกกล่องสุ่มสินค้าพรีเมียมที่คุณต้องการ มีให้เลือกหลากหลาย ราคาเริ่มต้นไม่กี่บาท ลุ้นรับของสะสมสุดพิเศษ",
  alternates: { canonical: "https://luxusx.com/boxes" },
  openGraph: {
    title: "กล่องสุ่มทั้งหมด | LuxusX",
    description: "เลือกกล่องสุ่มสินค้าพรีเมียมที่คุณต้องการ มีให้เลือกหลากหลาย ราคาเริ่มต้นไม่กี่บาท",
    url: "https://luxusx.com/boxes",
    type: "website",
  },
};

export default function BoxesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
