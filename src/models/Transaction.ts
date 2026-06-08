import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITransaction extends Document {
  userId: Types.ObjectId;
  type: "topup" | "withdraw" | "buy_box" | "sell_item" | "market_buy" | "market_sell" | "admin_adjust";
  amount: number;
  balanceAfter: number;
  description?: string;
  referenceId?: Types.ObjectId; // Could be BoxId, ItemId, or OrderId depending on type
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ["topup", "withdraw", "buy_box", "sell_item", "market_buy", "market_sell", "admin_adjust"], 
    required: true 
  },
  amount: { type: Number, required: true },
  balanceAfter: { type: Number, required: true },
  description: { type: String },
  referenceId: { type: Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema);
