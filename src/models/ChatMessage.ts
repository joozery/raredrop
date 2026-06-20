import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  senderRole: "user" | "admin";
  senderId: Types.ObjectId;
  text: string;
  imageUrl?: string;
  resolved: boolean; // แอดมินติดป้าย "ปิดเคสแล้ว" ให้คำขอนี้โดยเฉพาะ — แยกจากสถานะเปิด/ปิดของแชทรวมทั้งห้อง
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "ChatConversation", required: true },
  senderRole: { type: String, enum: ["user", "admin"], required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  imageUrl: { type: String },
  resolved: { type: Boolean, default: false },
}, { timestamps: true });

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

if (mongoose.models.ChatMessage) {
  delete (mongoose as any).models.ChatMessage;
}
export default mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
