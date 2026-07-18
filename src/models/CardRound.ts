import mongoose, { Schema, Document, Types } from "mongoose";

// รอบเกมสุ่มการ์ดพิเศษ — แชร์กันทุก user: การ์ด 10 ใบต่อรอบ ใครเปิดใบไหนแล้วใบนั้นจบ
// เปิดครบ 10 ใบ = ปิดรอบ แล้วระบบเปิดรอบใหม่อัตโนมัติ

interface IPrizeSnapshot {
  title: string;
  name: string;
  icon?: string;
  type: "coin" | "gemcoin" | "item" | "custom";
  amount?: number;
  itemId?: Types.ObjectId;
}

export interface ICardRoundCard {
  opened: boolean;
  openedBy?: Types.ObjectId;
  openedByName?: string;
  openedAt?: Date;
  // รางวัลประจำใบ — คละไว้ตั้งแต่ตอนแอดมินเปิดรอบ (1 รางวัล : 1 ใบ ไม่ซ้ำ)
  // ห้าม serialize ส่งออกไปก่อนใบนั้นถูกเปิด ไม่งั้นผู้เล่นแอบดูรางวัลได้
  assigned?: IPrizeSnapshot;
  // snapshot รางวัลที่เปิดได้แล้ว — ส่วนนี้สาธารณะ โชว์บนการ์ดหงาย
  prize?: IPrizeSnapshot;
}

export interface ICardRound extends Document {
  roundNumber: number;
  cards: ICardRoundCard[];
  status: "active" | "completed";
  completedAt?: Date;
}

const PrizeSnapshotSchema = new Schema({
  title: String,
  name: String,
  icon: String,
  type: { type: String, enum: ["coin", "gemcoin", "item", "custom"] },
  amount: Number,
  itemId: { type: Schema.Types.ObjectId, ref: "Item" },
}, { _id: false });

const CardSchema = new Schema({
  opened: { type: Boolean, default: false },
  openedBy: { type: Schema.Types.ObjectId, ref: "User" },
  openedByName: { type: String },
  openedAt: { type: Date },
  assigned: { type: PrizeSnapshotSchema, default: undefined },
  prize: { type: PrizeSnapshotSchema, default: undefined },
}, { _id: false });

const CardRoundSchema: Schema = new Schema({
  roundNumber: { type: Number, required: true },
  cards: { type: [CardSchema], default: [] },
  status: { type: String, enum: ["active", "completed"], default: "active" },
  completedAt: { type: Date },
}, { timestamps: true });

if (mongoose.models.CardRound) {
  delete (mongoose as any).models.CardRound;
}
export default mongoose.model<ICardRound>("CardRound", CardRoundSchema);
