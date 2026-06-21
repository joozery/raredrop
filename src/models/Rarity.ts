import mongoose, { Schema, Document } from "mongoose";

export interface IRarity extends Document {
  name: string;
  color: string;
  backgroundImage?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RaritySchema: Schema = new Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#CCCCCC" }, // HEX color code
  backgroundImage: { type: String }, // Optional background image URL
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

if (mongoose.models.Rarity) {
  delete mongoose.models.Rarity;
}

export default mongoose.model<IRarity>("Rarity", RaritySchema);
