import mongoose from "mongoose";

const MenuShortcutSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    url: { type: String, required: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.models.MenuShortcut || mongoose.model("MenuShortcut", MenuShortcutSchema);
