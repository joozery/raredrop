import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBoxCredit extends Document {
  userId: Types.ObjectId;
  boxId: Types.ObjectId;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
}

const BoxCreditSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  boxId: { type: Schema.Types.ObjectId, ref: "Box", required: true },
  credits: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

BoxCreditSchema.index({ userId: 1, boxId: 1 }, { unique: true });

export default mongoose.models.BoxCredit || mongoose.model<IBoxCredit>("BoxCredit", BoxCreditSchema);
