import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatMessage extends Document {
  conversationId: Types.ObjectId;
  senderRole: "user" | "admin";
  senderId: Types.ObjectId;
  text: string;
  createdAt: Date;
}

const ChatMessageSchema: Schema = new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: "ChatConversation", required: true },
  senderRole: { type: String, enum: ["user", "admin"], required: true },
  senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
}, { timestamps: true });

ChatMessageSchema.index({ conversationId: 1, createdAt: 1 });

export default mongoose.models.ChatMessage
  || mongoose.model<IChatMessage>("ChatMessage", ChatMessageSchema);
