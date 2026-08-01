import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import HoneycombBox from "@/models/HoneycombBox";
import HoneycombItem from "@/models/HoneycombItem";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const includeInactive = searchParams.get("admin") === "true";

    const filter = includeInactive ? {} : { isActive: true };
    const boxes = await HoneycombBox.find(filter)
      .populate({ path: "items.itemId", model: HoneycombItem })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    return NextResponse.json(boxes);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch honeycomb boxes" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const box = await HoneycombBox.create({
      name:        body.name,
      price:       Number(body.price) || 50,
      mainPrize:   body.mainPrize || "",
      description: body.description || "",
      image:       body.image || "/product/pokemon.webp",
      animation:   body.animation || null,
      badge:       body.badge || "",
      badgeBg:     body.badgeBg || "bg-red-600 text-white",
      isActive:    body.isActive !== undefined ? Boolean(body.isActive) : true,
      sortOrder:   Number(body.sortOrder) || 0,
      items:       [],
    });

    return NextResponse.json(box, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create honeycomb box" }, { status: 500 });
  }
}
