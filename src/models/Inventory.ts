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
  // ข้อมูลที่ลูกค้ากรอกตอนขอรับของจริง — เก็บแยกเพื่อโชว์เป็นคอลัมน์ในหน้า orders หลังบ้าน
  deliverUid?: string;
  deliverIgn?: string;
  deliverChannel?: "livechat" | "discord";
  // ทีมงานกด "จบงาน/จัดส่งแล้ว" ในหน้า orders
  fulfilled?: boolean;
  fulfilledAt?: Date;
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
  deliverUid: { type: String },
  deliverIgn: { type: String },
  deliverChannel: { type: String, enum: ["livechat", "discord"] },
  fulfilled: { type: Boolean, default: false },
  fulfilledAt: { type: Date },
}, { timestamps: true });

// ลบ model ที่ cache ไว้ เพื่อให้ schema ใหม่ (ฟิลด์ deliver*/fulfilled) ถูกใช้เสมอ
if (mongoose.models.Inventory) {
  delete (mongoose as any).models.Inventory;
}
export default mongoose.model<IInventory>("Inventory", InventorySchema);
