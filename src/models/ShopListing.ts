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
}, { timestamps: true });

export default mongoose.models.ShopListing || mongoose.model<IShopListing>("ShopListing", ShopListingSchema);
