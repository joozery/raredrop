import mongoose, { Schema, Document, Types } from "mongoose";

interface IParticipant {
  userId: Types.ObjectId;
  joinedAt: Date;
  rewardAmount?: number;
  isWinner?: boolean;
  claimConversationId?: Types.ObjectId; // เคสแชทที่เปิดไว้แล้วตอนผู้โชคดีกดขอรับไอเทม — กันเปิดเคสซ้ำซ้อนถ้ากดอีก
}

export interface IRedEnvelopeRound extends Document {
  label: string;
  image?: string; // รูปซองแดงที่ใช้แสดงในสไลด์ — ถ้าไม่ตั้งจะใช้กราฟิกซองแดงปกติ
  rewardType: "cash" | "item";
  totalAmount?: number; // รวมก้อนเงินที่จะสุ่มแจกให้ทุกคนที่เข้าร่วม (เฉพาะ cash)
  itemId?: Types.ObjectId; // รางวัลไอเทมเดียว สุ่มผู้โชคดี 1 คน (เฉพาะ item) — อ้างอิง RedEnvelopeItem แยกจากไอเทมร้านค้า/กล่องสุ่มโดยสิ้นเชิง
  conditionAmount: number; // ยอดใช้จ่ายขั้นต่ำวันนี้ที่ต้องมีถึงจะร่วมได้
  conditionLevel: number; // เลเวลขั้นต่ำที่ต้องมีถึงจะร่วมได้ — 0 = ไม่จำกัด
  maxPeople: number;
  scheduledAt: Date; // เริ่มเข้าร่วมได้
  endsAt: Date; // เส้นตาย — ปิดรับไม่ว่าจะครบคนหรือไม่
  isActive: boolean; // สวิตช์เปิด/ปิดใช้งานโดยแอดมิน — ปิดแล้วจะไม่แสดงในหน้าเว็บไม่ว่าจะอยู่ในช่วงเวลาหรือไม่
  status: "scheduled" | "open" | "resolved" | "cancelled";
  participants: IParticipant[];
  resolvedAt?: Date;
  // สุ่มเตรียมไว้ล่วงหน้าตอนสร้างรอบ (สับลำดับแล้ว) — กดรับครั้งที่ N ก็หยิบช่องที่ N ทันที ไม่ต้องรอใคร
  // ไม่ส่งออกผ่าน public API เด็ดขาด (จะเป็นการเฉลยรางวัลล่วงหน้า)
  allocations?: number[]; // หน่วยสตางค์ ต่อช่อง — เฉพาะ cash
  winnerSlot?: number; // index (0-based) ของช่องที่จะได้ไอเทม — เฉพาะ item
  createdAt: Date;
}

const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now },
  rewardAmount: { type: Number },
  isWinner: { type: Boolean },
  claimConversationId: { type: Schema.Types.ObjectId, ref: "ChatConversation" },
}, { _id: false });

const RedEnvelopeRoundSchema: Schema = new Schema({
  label: { type: String, required: true },
  image: { type: String },
  rewardType: { type: String, enum: ["cash", "item"], required: true },
  totalAmount: { type: Number },
  itemId: { type: Schema.Types.ObjectId, ref: "RedEnvelopeItem" },
  conditionAmount: { type: Number, default: 0 },
  conditionLevel: { type: Number, default: 0 },
  maxPeople: { type: Number, required: true, min: 1 },
  scheduledAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ["scheduled", "open", "resolved", "cancelled"], default: "scheduled" },
  participants: [ParticipantSchema],
  resolvedAt: { type: Date },
  allocations: { type: [Number], select: false },
  winnerSlot: { type: Number, select: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

RedEnvelopeRoundSchema.index({ scheduledAt: 1 });
RedEnvelopeRoundSchema.index({ "participants.userId": 1 });

if (mongoose.models.RedEnvelopeRound) {
  delete (mongoose as any).models.RedEnvelopeRound;
}
export default mongoose.model<IRedEnvelopeRound>("RedEnvelopeRound", RedEnvelopeRoundSchema);
