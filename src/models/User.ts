import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  lineId?: string;
  googleId?: string;
  email?: string;
  password?: string;
  name: string;
  avatar?: string;
  role: "user" | "admin" | "super_admin";
  coins: number;
  vipLevel: number;
  xp: number;
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
  vipLevel: { type: Number, default: 1 },
  xp: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
