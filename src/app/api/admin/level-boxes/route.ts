import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import LevelBoxReward from "@/models/LevelBoxReward";
import "@/models/Box";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes(session.user?.role);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const rewards = await LevelBoxReward.find()
      .populate("boxId", "name image price isActive")
      .sort({ minLevel: 1 });

    return NextResponse.json(rewards);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { minLevel, boxId, isActive } = await req.json();
    if (!minLevel || !boxId) {
      return NextResponse.json({ error: "กรุณาเลือกเลเวลขั้นต่ำและกล่องสุ่ม" }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await LevelBoxReward.findOne({ minLevel: Number(minLevel) });
    if (existing) {
      return NextResponse.json({ error: `มีการตั้งค่าเลเวล ${minLevel} อยู่แล้ว` }, { status: 400 });
    }

    const reward = await LevelBoxReward.create({
      minLevel: Number(minLevel),
      boxId,
      isActive: isActive !== undefined ? isActive : true,
    });
    const populated = await LevelBoxReward.findById(reward._id).populate("boxId", "name image price isActive");

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
