import mongoose, { Schema, Document } from "mongoose";

export interface IKnowledgeTopic extends Document {
  title: string;
  youtubeUrl: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const KnowledgeTopicSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    youtubeUrl: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.KnowledgeTopic ||
  mongoose.model<IKnowledgeTopic>("KnowledgeTopic", KnowledgeTopicSchema);
