import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPromoCode extends Document {
  code: string;
  description?: string;
  rewardType: "coins" | "gemCoins" | "item" | "box";
  rewardAmount?: number;
  itemId?: Types.ObjectId;
  boxId?: Types.ObjectId;
  boxOpenTimes?: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PromoCodeSchema: Schema = new Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String },
    rewardType: { type: String, enum: ["coins", "gemCoins", "item", "box"], required: true },
    rewardAmount: { type: Number },
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    boxId: { type: Schema.Types.ObjectId, ref: "Box" },
    boxOpenTimes: { type: Number, default: 1, min: 1 },
    maxUses: { type: Number, default: 0, min: 0 },
    usedCount: { type: Number, default: 0, min: 0 },
    expiresAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (mongoose.models.PromoCode) {
  delete (mongoose as any).models.PromoCode;
}
export default mongoose.model<IPromoCode>("PromoCode", PromoCodeSchema);
