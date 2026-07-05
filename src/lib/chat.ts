import ChatConversation, { IChatConversation } from "@/models/ChatConversation";
import ChatMessage from "@/models/ChatMessage";
import { HydratedDocument } from "mongoose";

// ลูกค้า 1 คน มีแชทเดียวกับทีมงานเสมอ ไม่ว่าจะมาจากกี่ช่องทาง (สอบถามสินค้า/รับของจริง/ซองแดง ฯลฯ)
// เรียกก่อนส่งข้อความใหม่ทุกครั้ง — ถ้ามีอยู่แล้วก็ใช้อันเดิม (เปิดกลับมาถ้าปิดไปแล้ว) ไม่สร้างเคสซ้ำ
export async function getOrCreateConversation(userId: string, subject: string): Promise<HydratedDocument<IChatConversation>> {
  const existing = await ChatConversation.findOne({ userId }).sort({ lastMessageAt: -1 });
  if (existing) {
    if (existing.status === "closed") existing.status = "open";
    await existing.save();
    return existing;
  }
  return ChatConversation.create({
    userId,
    subject,
    lastMessage: "",
    lastSender: "user",
    lastMessageAt: new Date(),
    unreadByAdmin: 0,
    status: "open",
  });
}

export async function appendUserMessage(
  convo: HydratedDocument<IChatConversation>,
  text: string,
  imageUrl?: string
) {
  await ChatMessage.create({
    conversationId: convo._id,
    senderRole: "user",
    senderId: convo.userId,
    text,
    imageUrl,
  });
  convo.lastMessage = text;
  convo.lastSender = "user";
  convo.lastMessageAt = new Date();
  convo.unreadByAdmin += 1;
  await convo.save();
}
