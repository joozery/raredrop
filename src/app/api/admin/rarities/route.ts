import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Rarity from "@/models/Rarity";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const rarities = await Rarity.find().sort({ order: 1, createdAt: -1 });
    return NextResponse.json(rarities);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, color, order, isActive } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    await connectToDatabase();
    const newRarity = await Rarity.create({
      name,
      color: color || "#CCCCCC",
      order: Number(order) || 0,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json(newRarity, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
