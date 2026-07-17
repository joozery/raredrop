import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBoxItem {
  itemId: Types.ObjectId;
  probability: number; // percentage (e.g. 10 for 10%)
  isLocked?: boolean; // พักรางวัลชั่วคราว — ไม่ออกจากการสุ่ม, หน้าร้านขึ้นป้าย "ไม่ร่วมการสุ่ม" และไม่นับใน % ที่แสดง
}

export interface IBox extends Document {
  name: string;
  description?: string;
  image: string;
  titleImage?: string;
  price: number;
  categoryId?: Types.ObjectId;
  isFeatured: boolean;
  isActive: boolean;
  items: IBoxItem[];
  animationType?: 'video' | 'roulette';
  animation?: string;
  pityThreshold: number;
  createdAt: Date;
  updatedAt: Date;
}

const BoxItemSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  probability: { type: Number, required: true, min: 0, max: 100 },
  isLocked: { type: Boolean, default: false },
}, { _id: false });

const BoxSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  titleImage: { type: String },
  price: { type: Number, required: true, min: 0 },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  items: [BoxItemSchema],
  animationType: { type: String, enum: ['video', 'roulette'], default: 'video' },
  animation: { type: String },
  pityThreshold: { type: Number, default: 100, min: 1 },
}, { timestamps: true });

if (mongoose.models.Box) {
  delete mongoose.models.Box;
}

export default mongoose.model<IBox>("Box", BoxSchema);
