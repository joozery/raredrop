import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Category from "@/models/Category";

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function GET() {
  try {
    await connectToDatabase();
    // หมวดหมู่เก่าบางตัวไม่มีฟิลด์ isActive เลย (สร้างไว้ก่อนเพิ่มฟิลด์นี้) ให้ถือว่าเปิดอยู่เหมือนกัน
    const categories = await Category.find({ isActive: { $ne: false } })
      .select("name slug image order")
      .sort({ order: 1, createdAt: -1 });

    // category เก่าที่ยังไม่มี slug ให้ auto-generate จากชื่อ
    const result = categories.map((c) => ({
      ...c.toObject(),
      slug: c.slug || toSlug(c.name),
    }));

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
