import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import FlashSale from "@/models/FlashSale";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await params;
  const body = await req.json();

  await connectToDatabase();
  const sale = await FlashSale.findByIdAndUpdate(
    id,
    {
      ...body,
      ...(body.endsAt ? { endsAt: new Date(body.endsAt) } : {}),
      ...(body.startsAt !== undefined ? { startsAt: body.startsAt ? new Date(body.startsAt) : null } : {}),
    },
    { new: true }
  );
  if (!sale) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(sale);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await params;
  await connectToDatabase();
  await FlashSale.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
