import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPromoCodeRedemption extends Document {
  codeId: Types.ObjectId;
  userId: Types.ObjectId;
  redeemedAt: Date;
}

const PromoCodeRedemptionSchema: Schema = new Schema({
  codeId: { type: Schema.Types.ObjectId, ref: "PromoCode", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  redeemedAt: { type: Date, default: Date.now },
});

PromoCodeRedemptionSchema.index({ codeId: 1, userId: 1 }, { unique: true });

if (mongoose.models.PromoCodeRedemption) {
  delete (mongoose as any).models.PromoCodeRedemption;
}
export default mongoose.model<IPromoCodeRedemption>("PromoCodeRedemption", PromoCodeRedemptionSchema);
