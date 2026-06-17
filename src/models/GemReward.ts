import mongoose, { Schema, Document, Types } from "mongoose";

export interface IGemReward extends Document {
  name: string;
  description?: string;
  image?: string;
  type: "box" | "item";
  boxId?: Types.ObjectId;
  boxOpenTimes?: number;
  itemId?: Types.ObjectId;
  gemCost: number;
  stock: number; // 0 = unlimited
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const GemRewardSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  type: { type: String, enum: ["box", "item"], required: true },
  boxId: { type: Schema.Types.ObjectId, ref: "Box" },
  boxOpenTimes: { type: Number, default: 1, min: 1 },
  itemId: { type: Schema.Types.ObjectId, ref: "Item" },
  gemCost: { type: Number, required: true, min: 1 },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.GemReward || mongoose.model<IGemReward>("GemReward", GemRewardSchema);
