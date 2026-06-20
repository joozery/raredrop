import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";

// GET — รายการเคสของฉัน
// ?countOnly=1 — คืนแค่จำนวนข้อความที่ยังไม่อ่านรวมทุกเคส (สำหรับ badge ปุ่มลอย)
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);

    if (searchParams.get("countOnly")) {
      const rows = await ChatConversation.find({ userId }).select("unreadByUser status");
      const unread = rows.reduce((sum, c) => sum + (c.unreadByUser || 0), 0);
      const openCases = rows.filter((c) => c.status === "open").length;
      return NextResponse.json({ unread, openCases });
    }

    const conversations = await ChatConversation.find({ userId })
      .sort({ lastMessageAt: -1 })
      .limit(100);

    return NextResponse.json({ conversations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — เปิดเคสใหม่ (พร้อมข้อความแรก ถ้ามี)
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subject, text } = await req.json();
    const subj = typeof subject === "string" && subject.trim() ? subject.trim() : "สอบถามทั่วไป";
    const firstText = typeof text === "string" ? text.trim() : "";
    if (firstText.length > 2000) return NextResponse.json({ error: "ข้อความยาวเกินไป" }, { status: 400 });

    await connectToDatabase();

    const convo = await ChatConversation.create({
      userId,
      subject: subj,
      lastMessage: firstText,
      lastSender: "user",
      lastMessageAt: new Date(),
      unreadByAdmin: firstText ? 1 : 0,
      status: "open",
    });

    if (firstText) {
      await ChatMessage.create({
        conversationId: convo._id,
        senderRole: "user",
        senderId: userId,
        text: firstText,
      });
    }

    return NextResponse.json({ success: true, conversationId: String(convo._id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
