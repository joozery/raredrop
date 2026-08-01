import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHoneycombItem extends Document {
  name: string;
  description?: string;
  image: string;
  category: "legendary" | "epic" | "rare" | "common";
  type: "item" | "coin_reward";
  coinAmount: number;
  value: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HoneycombItemSchema = new Schema<IHoneycombItem>(
  {
    name:        { type: String, required: true },
    description: { type: String, default: "" },
    image:       { type: String, default: "" },
    category:    { type: String, enum: ["legendary", "epic", "rare", "common"], default: "common" },
    type:        { type: String, enum: ["item", "coin_reward"], default: "item" },
    coinAmount:  { type: Number, default: 0 },
    value:       { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
  },
  { timestamps: true }
);

if (mongoose.models.HoneycombItem) delete (mongoose as any).models.HoneycombItem;
const HoneycombItem: Model<IHoneycombItem> = mongoose.model<IHoneycombItem>("HoneycombItem", HoneycombItemSchema);

export default HoneycombItem;
