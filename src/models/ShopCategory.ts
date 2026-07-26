import mongoose, { Schema, Document } from "mongoose";

export interface IShopCategory extends Document {
  name: string;
  slug?: string;
  image?: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

function toSlug(name: string) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

const ShopCategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true, sparse: true },
  image: { type: String },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

ShopCategorySchema.pre("save", function () {
  if (!this.slug) this.slug = toSlug(this.name as string);
});

if (mongoose.models.ShopCategory) {
  delete (mongoose as any).models.ShopCategory;
}
export default mongoose.model<IShopCategory>("ShopCategory", ShopCategorySchema);
