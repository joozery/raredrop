import mongoose, { Schema, Document, Types } from "mongoose";

export interface IItem extends Document {
  name: string;
  description?: string;
  image: string;
  rarityId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  price: number;
  sellPrice?: number;
  stock: number;
  unlimitedStock: boolean;
  contactChannels: { discord: boolean; livechat: boolean };
  isActive: boolean;
  animation?: string;
  type: "item" | "coin_reward";
  coinRewardAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  rarityId: { type: Schema.Types.ObjectId, ref: 'Rarity', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  price: { type: Number, required: true, min: 0 },
  // ราคาขายคืน — ถ้าไม่ตั้งค่าจะใช้ price (มูลค่าไอเทม) แทน
  sellPrice: { type: Number, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  // สต็อกไม่จำกัด — ถ้า true จะไม่หักสต็อกเลย
  unlimitedStock: { type: Boolean, default: false },
  // ช่องทางติดต่อทีมงานที่จะโชว์ตอนกด "รับ item" ของสินค้านี้
  contactChannels: {
    discord: { type: Boolean, default: true },
    livechat: { type: Boolean, default: true },
  },
  isActive: { type: Boolean, default: true },
  animation: { type: String },
  type: { type: String, enum: ["item", "coin_reward"], default: "item" },
  coinRewardAmount: { type: Number, default: 0 },
}, { timestamps: true });

// Clear cached model so schema changes (new fields) are always picked up
if (mongoose.models.Item) {
  delete (mongoose as any).models.Item;
}
export default mongoose.model<IItem>("Item", ItemSchema);
