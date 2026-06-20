import mongoose, { Schema, Document, Types } from "mongoose";

export interface IChatConversation extends Document {
  userId: Types.ObjectId;
  subject: string;
  lastMessage: string;
  lastSender: "user" | "admin";
  lastMessageAt: Date;
  unreadByAdmin: number;
  unreadByUser: number;
  status: "open" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const ChatConversationSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  subject: { type: String, default: "สอบถามทั่วไป" },
  lastMessage: { type: String, default: "" },
  lastSender: { type: String, enum: ["user", "admin"], default: "user" },
  lastMessageAt: { type: Date, default: Date.now },
  unreadByAdmin: { type: Number, default: 0 },
  unreadByUser: { type: Number, default: 0 },
  status: { type: String, enum: ["open", "closed"], default: "open" },
}, { timestamps: true });

ChatConversationSchema.index({ userId: 1, lastMessageAt: -1 });
ChatConversationSchema.index({ lastMessageAt: -1 });

export default mongoose.models.ChatConversation
  || mongoose.model<IChatConversation>("ChatConversation", ChatConversationSchema);
