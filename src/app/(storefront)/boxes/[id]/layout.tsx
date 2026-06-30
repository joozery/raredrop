import type { Metadata } from "next";
import { connectToDatabase } from "@/lib/mongoose";
import Box from "@/models/Box";

const BASE = "https://luxusx.com";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  try {
    const { id } = await params;
    await connectToDatabase();
    const box = await Box.findById(id).select("name description image").lean() as any;
    if (!box) return { title: "กล่องสุ่ม" };
    const title = `${box.name} - กล่องสุ่ม`;
    const description = box.description || `เปิดกล่องสุ่ม ${box.name} ลุ้นรับสินค้าพรีเมียม หลากหลายรายการ`;
    return {
      title,
      description,
      alternates: { canonical: `${BASE}/boxes/${id}` },
      openGraph: {
        title: `${title} | LuxusX`,
        description,
        url: `${BASE}/boxes/${id}`,
        type: "website",
        images: box.image ? [{ url: box.image, width: 800, height: 800, alt: box.name }] : [],
      },
    };
  } catch {
    return { title: "กล่องสุ่ม" };
  }
}

export default function BoxDetailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
