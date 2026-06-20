import mongoose, { Schema, Document, Types } from "mongoose";

export interface IFlashSale extends Document {
  boxId: Types.ObjectId;
  salePrice: number;
  startsAt: Date | null;
  endsAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FlashSaleSchema: Schema = new Schema({
  boxId: { type: Schema.Types.ObjectId, ref: "Box", required: true },
  salePrice: { type: Number, required: true, min: 0 },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.FlashSale || mongoose.model<IFlashSale>("FlashSale", FlashSaleSchema);
