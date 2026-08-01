import mongoose, { Schema, Document, Model } from "mongoose";

export interface IHoneyBoxItem {
  itemId: mongoose.Types.ObjectId;
  rate: number;
  isLocked: boolean;
}

export interface IHoneycombBox extends Document {
  name: string;
  price: number;
  mainPrize: string;
  description: string;
  image: string;
  animation?: string;
  badge?: string;
  badgeBg?: string;
  isActive: boolean;
  sortOrder: number;
  eventStartDate?: Date;
  eventEndDate?: Date;
  items: IHoneyBoxItem[];
  createdAt: Date;
  updatedAt: Date;
}

const HoneyBoxItemSchema = new Schema<IHoneyBoxItem>(
  {
    itemId:   { type: Schema.Types.ObjectId, ref: "HoneycombItem", required: true },
    rate:     { type: Number, default: 0 },
    isLocked: { type: Boolean, default: false },
  },
  { _id: false }
);

const HoneycombBoxSchema = new Schema<IHoneycombBox>(
  {
    name:        { type: String, required: true },
    price:       { type: Number, required: true, default: 50 },
    mainPrize:   { type: String, default: "" },
    description: { type: String, default: "" },
    image:       { type: String, default: "/product/pokemon.webp" },
    animation:   { type: String, default: null },
    badge:       { type: String, default: "" },
    badgeBg:     { type: String, default: "bg-red-600 text-white" },
    isActive:        { type: Boolean, default: true },
    sortOrder:       { type: Number, default: 0 },
    eventStartDate:  { type: Date, default: null },
    eventEndDate:    { type: Date, default: null },
    items:           [HoneyBoxItemSchema],
  },
  { timestamps: true }
);

if (mongoose.models.HoneycombBox) delete (mongoose as any).models.HoneycombBox;
const HoneycombBox: Model<IHoneycombBox> = mongoose.model<IHoneycombBox>("HoneycombBox", HoneycombBoxSchema);

export default HoneycombBox;
