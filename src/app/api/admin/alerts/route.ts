import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ChatConversation from "@/models/ChatConversation";
import TrueMoneyTopup from "@/models/TrueMoneyTopup";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [unreadChats, pendingTopups] = await Promise.all([
      ChatConversation.countDocuments({ unreadByAdmin: { $gt: 0 } }),
      TrueMoneyTopup.countDocuments({ status: "pending" })
    ]);

    return NextResponse.json({
      total: unreadChats + pendingTopups,
      unreadChats,
      pendingTopups
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
