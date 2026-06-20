import mongoose, { Schema, Document, Types } from "mongoose";

export interface ITrueMoneyTopup extends Document {
  userId: Types.ObjectId;
  amount: number;
  status: "pending" | "completed" | "expired";
  transactionId?: string;
  requestUrl?: string;
  createdAt: Date;
  completedAt?: Date;
}

const TrueMoneyTopupSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed", "expired"], default: "pending" },
  transactionId: { type: String, unique: true, sparse: true },
  requestUrl: { type: String },
  completedAt: { type: Date },
}, { timestamps: true });

if (mongoose.models.TrueMoneyTopup) {
  delete (mongoose as any).models.TrueMoneyTopup;
}
export default mongoose.model<ITrueMoneyTopup>("TrueMoneyTopup", TrueMoneyTopupSchema);
