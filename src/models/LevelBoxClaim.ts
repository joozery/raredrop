import mongoose, { Schema, Document, Types } from "mongoose";

export interface ILevelBoxClaim extends Document {
  userId: Types.ObjectId;
  boxId: Types.ObjectId;
  level: number;
  createdAt: Date;
}

const LevelBoxClaimSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    boxId: { type: Schema.Types.ObjectId, ref: "Box", required: true },
    level: { type: Number, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// ใช้เช็คว่าผู้เล่นกดรับสิทธิ์วันนี้ (เวลาไทย) ไปแล้วหรือยัง
LevelBoxClaimSchema.index({ userId: 1, createdAt: -1 });

delete mongoose.models.LevelBoxClaim;
export default mongoose.model<ILevelBoxClaim>("LevelBoxClaim", LevelBoxClaimSchema);
