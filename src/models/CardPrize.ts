import mongoose, { Schema, Document, Types } from "mongoose";

// รางวัลของเกมสุ่มการ์ดพิเศษ (หน้า /cards)
export interface ICardPrize extends Document {
  name: string;   // มูลค่า/ข้อความรางวัล เช่น "1,000" หรือ "100 บาท"
  title: string;  // ป้ายประเภท เช่น COIN / GEMCOIN / VOUCHER
  icon?: string;  // URL รูปไอคอนรางวัล
  type: "coin" | "gemcoin" | "item" | "custom"; // ชนิดรางวัลจริง — ใช้ตอนเข้าเครดิตให้ผู้เล่น
  amount: number; // จำนวนที่จะได้รับ (ใช้กับ coin/gemcoin)
  itemId?: Types.ObjectId; // ไอเทมจากคลัง (ใช้กับ type=item — ของจะเข้าคอลเลกชันผู้เล่น)
  weight: number; // น้ำหนักโอกาสออก (สัมพัทธ์ — ยิ่งมากยิ่งออกบ่อย)
  isSpecial: boolean; // รางวัลพิเศษ — ใครเปิดเจอใบที่ซ่อนรางวัลนี้ รอบจบทันที
  isActive: boolean;
  order: number;
}

const CardPrizeSchema: Schema = new Schema({
  name: { type: String, required: true },
  title: { type: String, required: true },
  icon: { type: String, default: "" },
  type: { type: String, enum: ["coin", "gemcoin", "item", "custom"], default: "custom" },
  amount: { type: Number, default: 0 },
  itemId: { type: Schema.Types.ObjectId, ref: "Item" },
  weight: { type: Number, default: 1 },
  isSpecial: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
}, { timestamps: true });

if (mongoose.models.CardPrize) {
  delete (mongoose as any).models.CardPrize;
}
export default mongoose.model<ICardPrize>("CardPrize", CardPrizeSchema);
