import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHoneycombReward extends Document {
  name: string;
  description?: string;
  image?: string;
  type: "box" | "item" | "shop";
  boxId?: Types.ObjectId;
  boxOpenTimes?: number;
  itemId?: Types.ObjectId;
  shopListingId?: Types.ObjectId;
  honeyCost: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HoneycombRewardSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String },
  type: { type: String, enum: ["box", "item", "shop"], required: true },
  boxId: { type: Schema.Types.ObjectId, ref: "Box" },
  boxOpenTimes: { type: Number, default: 1, min: 1 },
  itemId: { type: Schema.Types.ObjectId, ref: "Item" },
  shopListingId: { type: Schema.Types.ObjectId, ref: "ShopListing" },
  honeyCost: { type: Number, required: true, min: 1 },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

if (mongoose.models.HoneycombReward) delete (mongoose as any).models.HoneycombReward;
export default mongoose.model<IHoneycombReward>("HoneycombReward", HoneycombRewardSchema);
