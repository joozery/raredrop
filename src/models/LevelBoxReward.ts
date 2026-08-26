import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILevelBoxReward extends Document {
  minLevel: number;
  boxId: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LevelBoxRewardSchema: Schema = new Schema(
  {
    // เลเวลขั้นต่ำที่ปลดล็อกกล่องนี้ — ผู้เล่นจะได้สิทธิ์จากดัชนีที่ minLevel สูงสุดที่ <= เลเวลตัวเอง
    minLevel: { type: Number, required: true, unique: true, min: 1 },
    boxId: { type: Schema.Types.ObjectId, ref: "Box", required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

delete mongoose.models.LevelBoxReward;
export default mongoose.model<ILevelBoxReward>("LevelBoxReward", LevelBoxRewardSchema);
