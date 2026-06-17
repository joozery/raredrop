import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import FlashSale from "@/models/FlashSale";
import Box from "@/models/Box";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET(req: Request) {
  const err = await requireAdmin(req);
  if (err) return err;

  await connectToDatabase();
  const sales = await FlashSale.find()
    .populate({ path: "boxId", model: Box, select: "name image price" })
    .sort({ createdAt: -1 });

  return NextResponse.json(sales);
}

export async function POST(req: Request) {
  const err = await requireAdmin(req);
  if (err) return err;

  const { boxId, salePrice, endsAt, isActive } = await req.json();
  if (!boxId || salePrice == null || !endsAt) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  await connectToDatabase();
  const sale = await FlashSale.create({ boxId, salePrice, endsAt: new Date(endsAt), isActive: isActive ?? true });
  return NextResponse.json(sale, { status: 201 });
}
