import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledgeTopic extends Document {
  title: string;
  youtubeUrl: string;
  coverImage?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeTopicSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    youtubeUrl: { type: String, required: true },
    coverImage: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// ลบ model ที่ cache ไว้ เพื่อให้ schema ใหม่ (ฟิลด์ coverImage) ถูกใช้เสมอ
if (mongoose.models.KnowledgeTopic) {
  delete (mongoose as any).models.KnowledgeTopic;
}
export default mongoose.model<IKnowledgeTopic>("KnowledgeTopic", KnowledgeTopicSchema);
