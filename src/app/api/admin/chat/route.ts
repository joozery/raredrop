import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ChatConversation from "@/models/ChatConversation";
import User from "@/models/User";

// GET — รายการบทสนทนาทั้งหมด (เรียงตามข้อความล่าสุด)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const conversations = await ChatConversation.find()
      .populate({ path: "userId", model: User, select: "name avatar email" })
      .sort({ lastMessageAt: -1 })
      .limit(200);

    const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadByAdmin || 0), 0);

    return NextResponse.json({ conversations, totalUnread });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
