import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Category from "@/models/Category";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

export async function GET(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    await connectToDatabase();
    const type = new URL(req.url, "http://x").searchParams.get("type");
    const filter: any = type ? { type } : {};
    const categories = await Category.find(filter).sort({ order: 1, createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error: any) {
    console.error("[admin/categories GET]", error?.message, error?.stack);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { name, slug, description, image, order, isActive, type } = body;
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

    await connectToDatabase();
    const newCategory = await Category.create({
      name,
      slug: slug?.trim() || undefined,
      description,
      image,
      order: Number(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
      type: type || "box",
    });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (error: any) {
    console.error("[admin/categories POST]", error?.message);
    return NextResponse.json({ error: error?.message || "Internal Server Error" }, { status: 500 });
  }
}
