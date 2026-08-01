import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUser extends Document {
  lineId?: string;
  googleId?: string;
  email?: string;
  password?: string;
  name: string;
  avatar?: string;
  role: "user" | "admin" | "super_admin";
  coins: number;
  gemCoins: number;
  honeyCoins: number;
  vipLevel: number;
  xp: number;
  discordJoinClaimed?: boolean;
  referralCode?: string;
  referredBy?: Types.ObjectId;
  referralFlagged?: boolean;
  signupIp?: string;
  hideFromLeaderboard?: boolean;
  claimedLevels?: number[];
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  lineId: { type: String, unique: true, sparse: true },
  googleId: { type: String, unique: true, sparse: true },
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  name: { type: String, required: true },
  avatar: { type: String },
  role: { type: String, enum: ["user", "admin", "super_admin"], default: "user" },
  coins: { type: Number, default: 0 },
  gemCoins: { type: Number, default: 0 },
  honeyCoins: { type: Number, default: 0 },
  vipLevel: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  discordJoinClaimed: { type: Boolean, default: false },
  referralCode: { type: String, unique: true, sparse: true },
  referredBy: { type: Schema.Types.ObjectId, ref: "User" },
  // true = ตรวจพบ IP สมัครซ้ำกับผู้เชิญหรือคนอื่นที่ผู้เชิญคนนี้เชิญมาแล้ว — ไม่ได้รับรางวัล GemCoin
  referralFlagged: { type: Boolean, default: false },
  signupIp: { type: String },
  hideFromLeaderboard: { type: Boolean, default: false },
  claimedLevels: { type: [Number], default: [] },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
