import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILevelRewardItem {
  itemId: Types.ObjectId;
  quantity: number;
}

export interface ILevelConfig extends Document {
  level: number;
  xpRequired: number;
  rewardItems: ILevelRewardItem[];
  createdAt: Date;
  updatedAt: Date;
}

const LevelConfigSchema: Schema = new Schema(
  {
    level: { type: Number, required: true, unique: true, min: 2 },
    xpRequired: { type: Number, required: true, min: 1 },
    rewardItems: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        quantity: { type: Number, default: 1, min: 1 },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.models.LevelConfig ||
  mongoose.model<ILevelConfig>("LevelConfig", LevelConfigSchema);
