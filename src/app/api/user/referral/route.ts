import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import User from "@/models/User";
import crypto from "crypto";

function generateCode() {
  return crypto.randomBytes(6).toString("base64url").replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    let user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.referralCode) {
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = generateCode();
        try {
          user.referralCode = code;
          await user.save();
          break;
        } catch (err: any) {
          if (err?.code !== 11000) throw err;
          user = (await User.findById(userId))!;
        }
      }
    }

    const totalInvited = await User.countDocuments({ referredBy: userId });

    const origin = req.headers.get("origin") || new URL(req.url).origin;
    const inviteUrl = `${origin}/?ref=${user.referralCode}`;

    return NextResponse.json({ code: user.referralCode, inviteUrl, totalInvited });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
