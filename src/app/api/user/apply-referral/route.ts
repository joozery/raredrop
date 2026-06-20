import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import Setting from "@/models/Setting";
import { notify } from "@/lib/notify";

const MAX_ACCOUNT_AGE_MS = 24 * 60 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { code } = await req.json();
    const refCode = typeof code === "string" ? code.trim().toUpperCase() : "";
    if (!refCode) return NextResponse.json({ applied: false });

    await connectToDatabase();

    const me = await User.findById(userId).select("referralCode referredBy createdAt");
    if (!me) return NextResponse.json({ applied: false });
    if (me.referredBy) return NextResponse.json({ applied: false });
    if (me.referralCode === refCode) return NextResponse.json({ applied: false });
    if (Date.now() - new Date(me.createdAt).getTime() > MAX_ACCOUNT_AGE_MS) {
      return NextResponse.json({ applied: false });
    }

    const inviter = await User.findOne({ referralCode: refCode }).select("_id gemCoins");
    if (!inviter) return NextResponse.json({ applied: false });

    const updated = await User.findOneAndUpdate(
      { _id: userId, referredBy: { $exists: false } },
      { $set: { referredBy: inviter._id } }
    );
    if (!updated) return NextResponse.json({ applied: false });

    const setting = await Setting.findOne({ key: "referral_reward_gemcoin" }).lean();
    const reward = typeof setting?.value === "number" ? setting.value : 0;

    if (reward > 0) {
      await User.findByIdAndUpdate(inviter._id, { $inc: { gemCoins: reward } });
      await notify(
        String(inviter._id),
        "เพื่อนของคุณสมัครสมาชิกแล้ว! 🎉",
        `+${reward} GemCoin จากการเชิญเพื่อน`,
        "success",
        "/profile"
      );
    }

    return NextResponse.json({ applied: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
