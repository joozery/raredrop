import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import ShopCategory from "@/models/ShopCategory";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const categories = await ShopCategory.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { name, slug, image, order, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "กรุณากรอกชื่อหมวดหมู่" }, { status: 400 });
    }

    await connectToDatabase();
    const category = await ShopCategory.create({
      name,
      slug: slug?.trim() || undefined,
      image: image || undefined,
      order: Number(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
