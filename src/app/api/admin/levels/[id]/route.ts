import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import LevelConfig from "@/models/LevelConfig";
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
  const { level, xpRequired, rewardItems, logoImage, colorTheme, tagImage } = await req.json();

  await connectToDatabase();
  const config = await LevelConfig.findByIdAndUpdate(
    id,
    { ...(level != null ? { level } : {}), ...(xpRequired != null ? { xpRequired } : {}), ...(rewardItems != null ? { rewardItems } : {}), ...(logoImage !== undefined ? { logoImage } : {}), ...(colorTheme ? { colorTheme } : {}), ...(tagImage !== undefined ? { tagImage } : {}) },
    { new: true }
  );
  if (!config) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(config);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const err = await requireAdmin();
  if (err) return err;

  const { id } = await params;
  await connectToDatabase();
  await LevelConfig.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
