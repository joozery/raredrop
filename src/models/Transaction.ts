import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: "topup" | "withdraw" | "buy_box" | "sell_item" | "market_buy" | "market_sell" | "admin_adjust" | "shop_buy" | "red_envelope" | "card_game";
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceId?: Types.ObjectId;
  slipUrl?: string; // URL รูปสลิปที่อัปโหลดไป R2
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ["topup", "withdraw", "buy_box", "sell_item", "market_buy", "market_sell", "admin_adjust", "shop_buy", "red_envelope", "card_game"],
    required: true
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String },
  referenceId: { type: Schema.Types.ObjectId },
  slipUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Transaction) {
  delete (mongoose as any).models.Transaction;
}
export default mongoose.model<ITransaction>("Transaction", TransactionSchema);
