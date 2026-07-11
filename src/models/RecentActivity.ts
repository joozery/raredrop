import mongoose, { Schema, Document, Types } from "mongoose";

// Unified realtime feed for the homepage "คำสั่งซื้อล่าสุด" section.
// Both shop purchases (kind: "shop") and box openings (kind: "box") write one doc here.
// User name/avatar are snapshotted so the feed needs no populate and the socket payload
// is self-contained.
export interface IRecentActivity extends Document {
  userId: Types.ObjectId;
  userName: string;
  userAvatar?: string;
  title: string;
  image?: string;
  price: number;
  kind: "shop" | "box";
  createdAt: Date;
}

const RecentActivitySchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true, default: 0 },
    kind: { type: String, enum: ["shop", "box"], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RecentActivitySchema.index({ createdAt: -1 });

export default mongoose.models.RecentActivity ||
  mongoose.model<IRecentActivity>("RecentActivity", RecentActivitySchema);
