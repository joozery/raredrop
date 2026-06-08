import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISetting extends Document {
  key: string;
  value: string | number | boolean;
  label: string;
  description?: string;
  type: "text" | "boolean" | "number" | "select";
  group: string;
  options?: string[];
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

const SettingSchema: Schema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
    label: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["text", "boolean", "number", "select"], default: "text" },
    group: { type: String, required: true },
    options: [{ type: String }],
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Setting || mongoose.model<ISetting>("Setting", SettingSchema);
