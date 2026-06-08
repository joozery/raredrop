import mongoose, { Schema, Document } from "mongoose";

export interface IRarity extends Document {
  name: string;
  color: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RaritySchema: Schema = new Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#CCCCCC" }, // HEX color code
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.models.Rarity || mongoose.model<IRarity>("Rarity", RaritySchema);
