import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPurchase extends Document {
  userId: Types.ObjectId;
  shopListingId: Types.ObjectId;
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  deliveredData: string;
  createdAt: Date;
}

const PurchaseSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  shopListingId: { type: Schema.Types.ObjectId, ref: "ShopListing", required: true },
  listingTitle: { type: String, required: true },
  listingImage: { type: String },
  pricePaid: { type: Number, required: true },
  deliveredData: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);
