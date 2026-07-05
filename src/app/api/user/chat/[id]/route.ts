import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import { notifyDiscordChat } from "@/lib/discordNotify";

// GET — ข้อความในเคส (เฉพาะเจ้าของ) + reset unread ฝั่ง user
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const convo = await ChatConversation.findOne({ _id: id, userId });
    if (!convo) return NextResponse.json({ error: "ไม่พบเคสนี้" }, { status: 404 });

    const messages = await ChatMessage.find({ conversationId: convo._id }).sort({ createdAt: 1 });

    if (convo.unreadByUser > 0) {
      convo.unreadByUser = 0;
      await convo.save();
    }

    return NextResponse.json({
      conversationId: String(convo._id),
      subject: convo.subject,
      status: convo.status,
      messages,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — ส่งข้อความเข้าเคส (เฉพาะเจ้าของ และเฉพาะเคสที่ยังเปิด)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { text, image } = await req.json();
    const trimmed = typeof text === "string" ? text.trim() : "";
    const imageUrl = typeof image === "string" && image.trim() ? image.trim() : undefined;
    if (!trimmed && !imageUrl) return NextResponse.json({ error: "ข้อความว่างเปล่า" }, { status: 400 });
    if (trimmed.length > 2000) return NextResponse.json({ error: "ข้อความยาวเกินไป" }, { status: 400 });

    await connectToDatabase();

    const convo = await ChatConversation.findOne({ _id: id, userId });
    if (!convo) return NextResponse.json({ error: "ไม่พบเคสนี้" }, { status: 404 });
    if (convo.status === "closed") {
      return NextResponse.json({ error: "เคสนี้ถูกปิดแล้ว กรุณาเปิดเคสใหม่" }, { status: 400 });
    }

    const message = await ChatMessage.create({
      conversationId: convo._id,
      senderRole: "user",
      senderId: userId,
      text: trimmed,
      imageUrl,
    });

    convo.lastMessage = trimmed || "📷 รูปภาพ";
    convo.lastSender = "user";
    convo.lastMessageAt = new Date();
    convo.unreadByAdmin += 1;
    await convo.save();

    const user = session.user as any;
    notifyDiscordChat({
      userName: user.name,
      userEmail: user.email,
      conversationId: id,
      text: trimmed || undefined,
      imageUrl,
      isNew: false,
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
