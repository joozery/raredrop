import mongoose, { Schema, Document } from "mongoose";

export interface IRedEnvelopeItem extends Document {
  name: string;
  image?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedEnvelopeItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  image: { type: String },
  description: { type: String },
}, { timestamps: true });

if (mongoose.models.RedEnvelopeItem) {
  delete (mongoose as any).models.RedEnvelopeItem;
}
export default mongoose.model<IRedEnvelopeItem>("RedEnvelopeItem", RedEnvelopeItemSchema);
