import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import ChatMessage from "@/models/ChatMessage";

function isAdmin(session: any) {
  return session && ["admin", "super_admin"].includes((session.user as any)?.role);
}

// PATCH — แอดมินติด/ถอนป้าย "ปิดเคสแล้ว" ให้ข้อความคำขอนี้โดยเฉพาะ (ไม่กระทบสถานะเปิด/ปิดของแชทรวม)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!isAdmin(session)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, messageId } = await params;
    const { resolved } = await req.json();
    if (typeof resolved !== "boolean") {
      return NextResponse.json({ error: "resolved ต้องเป็น boolean" }, { status: 400 });
    }

    await connectToDatabase();

    const message = await ChatMessage.findOneAndUpdate(
      { _id: messageId, conversationId: id },
      { resolved },
      { new: true }
    );
    if (!message) return NextResponse.json({ error: "ไม่พบข้อความนี้" }, { status: 404 });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
