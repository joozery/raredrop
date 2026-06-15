import mongoose, { Schema, Document, Types } from "mongoose";

export interface IItem extends Document {
  name: string;
  description?: string;
  image: string;
  rarityId: Types.ObjectId;
  categoryId?: Types.ObjectId;
  price: number; // Value of the item
  stock: number;
  isActive: boolean;
  animation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  rarityId: { type: Schema.Types.ObjectId, ref: 'Rarity', required: true },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  animation: { type: String },
}, { timestamps: true });

export default mongoose.models.Item || mongoose.model<IItem>("Item", ItemSchema);
