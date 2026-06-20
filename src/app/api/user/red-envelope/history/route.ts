import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
// จำเป็นต้อง import ไว้เพื่อให้ mongoose ลงทะเบียน schema ก่อน populate "itemId" ด้านล่าง
import "@/models/RedEnvelopeItem";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const rounds = await RedEnvelopeRound.find({
      status: "resolved",
      "participants.userId": userId,
    })
      .populate("itemId", "name image")
      .sort({ resolvedAt: -1 })
      .limit(100)
      .lean();

    const history = rounds.map((r: any) => {
      const me = r.participants.find((p: any) => String(p.userId) === String(userId));
      return {
        _id: r._id,
        label: r.label,
        rewardType: r.rewardType,
        rewardAmount: me?.rewardAmount,
        isWinner: me?.isWinner,
        item: r.itemId ? { name: r.itemId.name, image: r.itemId.image } : null,
        resolvedAt: r.resolvedAt,
      };
    });

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
