import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email?: string;
  phone?: string;
  otp?: string;        // email OTP flow (เก็บ code ตรงๆ)
  reference?: string;  // phone OTP flow (SepSMS reference สำหรับ verify)
  createdAt: Date;
}

delete (mongoose.models as any).Otp;

const OtpSchema: Schema = new Schema({
  email: { type: String },
  phone: { type: String },
  otp: { type: String },
  reference: { type: String },
  createdAt: { type: Date, default: Date.now, expires: 300 },
});

export default mongoose.model<IOtp>("Otp", OtpSchema);
