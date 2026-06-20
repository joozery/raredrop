import mongoose, { Schema, Document } from "mongoose";

export interface IBanner extends Document {
  image: string;
  link?: string;
  // หน้าที่ใช้แสดงแบนเนอร์นี้ — เผื่ออนาคตเพิ่มแบนเนอร์ของหน้าอื่นได้ด้วย
  page: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerSchema: Schema = new Schema({
  image: { type: String, required: true },
  link: { type: String },
  page: { type: String, required: true, default: "shop" },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

if (mongoose.models.Banner) {
  delete (mongoose as any).models.Banner;
}
export default mongoose.model<IBanner>("Banner", BannerSchema);
