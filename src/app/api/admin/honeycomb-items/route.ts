import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombItem from "@/models/HoneycombItem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const items = await HoneycombItem.find().sort({ createdAt: -1 });
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { name, description, image, category, type, coinAmount, value, isActive } = body;
    if (!name) return NextResponse.json({ error: "กรุณากรอกชื่อไอเทม" }, { status: 400 });
    if (type !== "coin_reward" && !image) return NextResponse.json({ error: "กรุณาอัพโหลดรูปภาพ" }, { status: 400 });

    await connectToDatabase();
    const item = await HoneycombItem.create({
      name,
      description: description || "",
      image: image || "",
      category: category || "common",
      type: type || "item",
      coinAmount: Number(coinAmount) || 0,
      value: Number(value) || 0,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
