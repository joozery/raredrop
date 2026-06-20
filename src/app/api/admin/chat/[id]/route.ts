import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ChatConversation from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import User from "@/models/User";
import { notify } from "@/lib/notify";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes((session.user as any)?.role);
}

// GET — ข้อความในบทสนทนา + reset unread ฝั่ง admin
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const convo = await ChatConversation.findById(id)
      .populate({ path: "userId", model: User, select: "name avatar email" });
    if (!convo) return NextResponse.json({ error: "ไม่พบบทสนทนา" }, { status: 404 });

    const messages = await ChatMessage.find({ conversationId: convo._id }).sort({ createdAt: 1 });

    if (convo.unreadByAdmin > 0) {
      convo.unreadByAdmin = 0;
      await convo.save();
    }

    return NextResponse.json({ conversation: convo, messages });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — admin ตอบกลับ
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const adminId = (session!.user as any).id;

    const { id } = await params;
    const { text } = await req.json();
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (!trimmed) return NextResponse.json({ error: "ข้อความว่างเปล่า" }, { status: 400 });
    if (trimmed.length > 2000) return NextResponse.json({ error: "ข้อความยาวเกินไป" }, { status: 400 });

    await connectToDatabase();

    const convo = await ChatConversation.findById(id);
    if (!convo) return NextResponse.json({ error: "ไม่พบบทสนทนา" }, { status: 404 });

    const message = await ChatMessage.create({
      conversationId: convo._id,
      senderRole: "admin",
      senderId: adminId,
      text: trimmed,
    });

    convo.lastMessage = trimmed;
    convo.lastSender = "admin";
    convo.lastMessageAt = new Date();
    convo.unreadByUser += 1;
    await convo.save();

    // แจ้งเตือนลูกค้า (bell)
    await notify(
      String(convo.userId),
      "ทีมงานตอบกลับแล้ว 💬",
      trimmed.length > 60 ? trimmed.slice(0, 60) + "…" : trimmed,
      "info"
    );

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH — เปิด/ปิดบทสนทนา
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { status } = await req.json();
    if (!["open", "closed"].includes(status)) {
      return NextResponse.json({ error: "สถานะไม่ถูกต้อง" }, { status: 400 });
    }

    await connectToDatabase();
    const convo = await ChatConversation.findByIdAndUpdate(id, { status }, { new: true });
    if (!convo) return NextResponse.json({ error: "ไม่พบบทสนทนา" }, { status: 404 });

    return NextResponse.json({ success: true, status: convo.status });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
