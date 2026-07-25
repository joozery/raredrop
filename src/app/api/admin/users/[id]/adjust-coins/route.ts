import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Transaction from "@/models/Transaction";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    const adminId = (session?.user as any)?.id;
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { action, amount, coinType, note } = body as {
      action: "add" | "subtract";
      amount: number;
      coinType: "coins" | "gemCoins";
      note?: string;
    };

    if (!["add", "subtract"].includes(action)) {
      return NextResponse.json({ error: "action ต้องเป็น add หรือ subtract" }, { status: 400 });
    }
    if (!["coins", "gemCoins"].includes(coinType)) {
      return NextResponse.json({ error: "coinType ไม่ถูกต้อง" }, { status: 400 });
    }
    const amt = Number(amount);
    if (!amt || amt <= 0 || !Number.isFinite(amt)) {
      return NextResponse.json({ error: "จำนวนต้องมากกว่า 0" }, { status: 400 });
    }

    await connectToDatabase();

    const delta = action === "add" ? amt : -amt;
    const field = coinType;

    let updatedUser;
    if (action === "subtract") {
      // ตัดแบบ atomic — ป้องกันยอดติดลบ
      updatedUser = await User.findOneAndUpdate(
        { _id: id, [field]: { $gte: amt } },
        { $inc: { [field]: delta } },
        { new: true },
      );
      if (!updatedUser) {
        const existing = await User.findById(id).select(field).lean() as any;
        if (!existing) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
        return NextResponse.json(
          { error: `ยอด${coinType === "coins" ? "เครดิต" : "GemCoin"} ไม่เพียงพอ (มี ${existing[field]?.toLocaleString() ?? 0})` },
          { status: 400 },
        );
      }
    } else {
      updatedUser = await User.findByIdAndUpdate(
        id,
        { $inc: { [field]: delta } },
        { new: true },
      );
      if (!updatedUser) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });
    }

    // บันทึก Transaction (เฉพาะ coins — gemCoins ยังไม่มี type ของตัวเอง)
    if (coinType === "coins") {
      await Transaction.create({
        userId: id,
        type: "admin_adjust",
        amount: delta,
        balanceAfter: updatedUser.coins,
        description: note
          ? `แอดมิน ${action === "add" ? "เพิ่ม" : "ลด"}เครดิต: ${note}`
          : `แอดมิน ${action === "add" ? "เพิ่ม" : "ลด"}เครดิต`,
        referenceId: adminId,
      });
    }

    return NextResponse.json({
      ok: true,
      coins: updatedUser.coins,
      gemCoins: updatedUser.gemCoins,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
