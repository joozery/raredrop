import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectToDatabase();
    // หมวดหมู่เก่าบางตัวไม่มีฟิลด์ isActive เลย (สร้างไว้ก่อนเพิ่มฟิลด์นี้) ให้ถือว่าเปิดอยู่เหมือนกัน
    const categories = await Category.find({ isActive: { $ne: false } })
      .select("name image order")
      .sort({ order: 1, createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
