import mongoose, { Schema, Document } from "mongoose";

export interface IShopCategory extends Document {
  name: string;
  image?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ShopCategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  image: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

if (mongoose.models.ShopCategory) {
  delete (mongoose as any).models.ShopCategory;
}
export default mongoose.model<IShopCategory>("ShopCategory", ShopCategorySchema);
