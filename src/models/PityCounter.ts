import mongoose, { Schema, Document, Types } from "mongoose";

export interface IPityCounter extends Document {
  userId: Types.ObjectId;
  boxId: Types.ObjectId;
  count: number;
  updatedAt: Date;
}

const PityCounterSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  boxId: { type: Schema.Types.ObjectId, ref: "Box", required: true },
  count: { type: Number, default: 0 },
}, { timestamps: true });

PityCounterSchema.index({ userId: 1, boxId: 1 }, { unique: true });

export default mongoose.models.PityCounter || mongoose.model<IPityCounter>("PityCounter", PityCounterSchema);
