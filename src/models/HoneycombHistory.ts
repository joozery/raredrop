import mongoose, { Schema, Document, Types } from "mongoose";

export interface IHoneycombHistory extends Document {
  userId: Types.ObjectId;
  boxId: Types.ObjectId;
  rewardName: string;
  rewardType: "coin" | "item";
  rewardValue: number;
  coinAmount?: number;
  rewardCategory: string;
  rewardImage: string;
  rewardBadgeText: string;
  createdAt: Date;
}

const HoneycombHistorySchema = new Schema<IHoneycombHistory>({
  userId:         { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  boxId:          { type: Schema.Types.ObjectId, ref: "HoneycombBox", required: true },
  rewardName:     { type: String, required: true },
  rewardType:     { type: String, enum: ["coin", "item"], required: true },
  rewardValue:    { type: Number, default: 0 },
  coinAmount:     { type: Number, default: 0 },
  rewardCategory: { type: String, default: "common" },
  rewardImage:    { type: String, default: "" },
  rewardBadgeText:{ type: String, default: "" },
}, { timestamps: true });

if (mongoose.models.HoneycombHistory) delete (mongoose as any).models.HoneycombHistory;
export default mongoose.model<IHoneycombHistory>("HoneycombHistory", HoneycombHistorySchema);
