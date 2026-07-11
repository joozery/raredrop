import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPurchase extends Document {
  userId: Types.ObjectId;
  shopListingId: Types.ObjectId;
  listingTitle: string;
  listingImage?: string;
  pricePaid: number;
  deliveredData: string;
  buyerUid?: string;
  // การซื้อครั้งเดียวหลายชิ้นจะแตกเป็นหลาย record — batchId ผูกไว้ด้วยกันเพื่อรวมโชว์เป็นออเดอร์เดียว
  batchId?: string;
  batchQuantity?: number;
  // ทีมงานกด "จบงาน/เติมเรียบร้อย" ในหน้า orders
  fulfilled?: boolean;
  fulfilledAt?: Date;
  createdAt: Date;
}

const PurchaseSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  shopListingId: { type: Schema.Types.ObjectId, ref: "ShopListing", required: true },
  listingTitle: { type: String, required: true },
  listingImage: { type: String },
  pricePaid: { type: Number, required: true },
  deliveredData: { type: String, required: true },
  buyerUid: { type: String },
  batchId: { type: String, index: true },
  batchQuantity: { type: Number, default: 1 },
  fulfilled: { type: Boolean, default: false },
  fulfilledAt: { type: Date },
}, { timestamps: true });

if (mongoose.models.Purchase) {
  delete (mongoose as any).models.Purchase;
}
export default mongoose.model<IPurchase>("Purchase", PurchaseSchema);
