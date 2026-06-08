import mongoose, { Schema, Document, Types } from "mongoose";

export interface IBoxItem {
  itemId: Types.ObjectId;
  probability: number; // percentage (e.g. 10 for 10%)
}

export interface IBox extends Document {
  name: string;
  description?: string;
  image: string;
  price: number;
  categoryId?: Types.ObjectId;
  isFeatured: boolean;
  isActive: boolean;
  items: IBoxItem[];
  createdAt: Date;
  updatedAt: Date;
}

const BoxItemSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  probability: { type: Number, required: true, min: 0, max: 100 },
}, { _id: false });

const BoxSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String },
  image: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  items: [BoxItemSchema],
}, { timestamps: true });

export default mongoose.models.Box || mongoose.model<IBox>("Box", BoxSchema);
