import mongoose, { Schema, Document, Types } from "mongoose";

export interface IOrder extends Document {
  sellerId: Types.ObjectId;
  buyerId?: Types.ObjectId;
  inventoryId: Types.ObjectId; // The specific item instance
  itemId: Types.ObjectId; // The item template (for easy query)
  price: number;
  status: "active" | "sold" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  buyerId: { type: Schema.Types.ObjectId, ref: 'User' },
  inventoryId: { type: Schema.Types.ObjectId, ref: 'Inventory', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  price: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["active", "sold", "cancelled"], default: "active" },
}, { timestamps: true });

export default mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);
