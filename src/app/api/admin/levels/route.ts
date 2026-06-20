import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import LevelConfig from "@/models/LevelConfig";
import Setting from "@/models/Setting";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;

  await connectToDatabase();
  const [levels, expSetting] = await Promise.all([
    LevelConfig.find()
      .sort({ level: 1 })
      .populate({ path: "rewardItems.itemId", select: "name image rarityId", populate: { path: "rarityId", select: "name color" } }),
    Setting.findOne({ key: "exp_per_baht" }).lean(),
  ]);

  return NextResponse.json({ levels, expPerBaht: Number((expSetting as any)?.value ?? 1) });
}

export async function POST(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const { level, xpRequired, rewardItems } = await req.json();
  if (!level || xpRequired == null) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  await connectToDatabase();
  const exists = await LevelConfig.findOne({ level });
  if (exists) return NextResponse.json({ error: `เลเวล ${level} มีอยู่แล้ว` }, { status: 400 });

  const config = await LevelConfig.create({ level, xpRequired, rewardItems: rewardItems ?? [] });
  return NextResponse.json(config, { status: 201 });
}

export async function PATCH(req: Request) {
  const err = await requireAdmin();
  if (err) return err;

  const { expPerBaht } = await req.json();
  if (expPerBaht == null || Number(expPerBaht) < 0) {
    return NextResponse.json({ error: "ค่าไม่ถูกต้อง" }, { status: 400 });
  }

  await connectToDatabase();
  await Setting.findOneAndUpdate(
    { key: "exp_per_baht" },
    { key: "exp_per_baht", value: Number(expPerBaht), label: "EXP ต่อ ฿1 เติมเงิน", type: "number", group: "gameplay" },
    { upsert: true }
  );

  return NextResponse.json({ success: true, expPerBaht: Number(expPerBaht) });
}
