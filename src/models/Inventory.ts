import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInventory extends Document {
  userId: Types.ObjectId;
  itemId: Types.ObjectId;
  boxId?: Types.ObjectId; // Source of the item
  status: "kept" | "sold" | "delivered" | "market"; 
  // kept: in user's inventory
  // sold: user sold it back to the system for coins
  // delivered: user requested physical delivery
  // market: user listed it on the marketplace
  acquiredAt: Date;
  updatedAt: Date;
  // Discord ticket (deliver via Discord) — เซ็ตเฉพาะตอนสร้าง ticket จริง
  discordThreadId?: string;
  discordThreadUrl?: string;
  ticketStatus?: "open" | "claimed" | "closed";
  claimedBy?: string;
  claimedAt?: Date;
  closedAt?: Date;
}

const InventorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  boxId: { type: Schema.Types.ObjectId, ref: 'Box' },
  status: { type: String, enum: ["kept", "sold", "delivered", "market"], default: "kept" },
  acquiredAt: { type: Date, default: Date.now },
  discordThreadId: { type: String },
  discordThreadUrl: { type: String },
  ticketStatus: { type: String, enum: ["open", "claimed", "closed"] },
  claimedBy: { type: String },
  claimedAt: { type: Date },
  closedAt: { type: Date },
}, { timestamps: true });

export default mongoose.models.Inventory || mongoose.model<IInventory>("Inventory", InventorySchema);
