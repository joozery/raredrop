import mongoose, { Schema, Document, Types } from "mongoose";

interface IAccount {
  data: string;
  sold: boolean;
  soldTo?: Types.ObjectId;
  soldAt?: Date;
}

export interface IShopListing extends Document {
  title: string;
  description?: string;
  images: string[];
  price: number;
  accounts: IAccount[];
  status: "active" | "hidden";
  liveChatEnabled: boolean;
  youtubeUrl?: string;
  categoryId?: Types.ObjectId;
  isFeatured: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const AccountSchema = new Schema({
  data: { type: String, required: true },
  sold: { type: Boolean, default: false },
  soldTo: { type: Schema.Types.ObjectId, ref: "User" },
  soldAt: { type: Date },
}, { _id: true });

const ShopListingSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  images: [{ type: String }],
  price: { type: Number, required: true, min: 0 },
  accounts: [AccountSchema],
  status: { type: String, enum: ["active", "hidden"], default: "active" },
  // เปิดให้ลูกค้าสอบถามผ่าน live chat ในเว็บ (ไม่มี Discord)
  liveChatEnabled: { type: Boolean, default: false },
  // ลิงก์ YouTube สอนวิธีใช้งาน — แสดงปุ่ม "ดูวิธี"
  youtubeUrl: { type: String },
  // หมวดหมู่เกมของร้านค้า — แยกชุดข้อมูลจาก Category ของกล่องสุ่มโดยสิ้นเชิง
  categoryId: { type: Schema.Types.ObjectId, ref: "ShopCategory" },
  // สินค้าแนะนำ — แสดงใน section พิเศษหน้าร้านค้า
  isFeatured: { type: Boolean, default: false },
  // ลำดับการแสดงผล — เรียงจากน้อยไปมาก, ค่าเริ่มต้น 0 ทุกตัว (จะ tiebreak ด้วย createdAt จนกว่าแอดมินจะลากจัดเรียงจริง)
  order: { type: Number, default: 0 },
}, { timestamps: true });

// ลบ model ที่ cache ไว้ เพื่อให้ schema ใหม่ (ฟิลด์ใหม่) ถูกใช้เสมอ
if (mongoose.models.ShopListing) {
  delete (mongoose as any).models.ShopListing;
}
export default mongoose.model<IShopListing>("ShopListing", ShopListingSchema);
