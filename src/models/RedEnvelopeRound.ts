import mongoose, { Schema, Document, Types } from "mongoose";

interface IParticipant {
  userId: Types.ObjectId;
  joinedAt: Date;
  rewardAmount?: number;
  isWinner?: boolean;
  claimConversationId?: Types.ObjectId;
}

export interface IRedEnvelopeRound extends Document {
  label: string;
  image?: string;
  rewardType: "cash" | "item" | "gemcoin";
  totalAmount?: number;
  totalGemCoins?: number;
  itemId?: Types.ObjectId;
  conditionAmount: number;
  conditionLevel: number;
  maxPeople: number;
  scheduledAt: Date;
  endsAt: Date;
  isActive: boolean;
  status: "scheduled" | "open" | "resolved" | "cancelled";
  participants: IParticipant[];
  resolvedAt?: Date;
  allocations?: number[];
  winnerSlot?: number;
  createdAt: Date;
}

const ParticipantSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  joinedAt: { type: Date, default: Date.now },
  rewardAmount: { type: Number },
  isWinner: { type: Boolean },
  claimConversationId: { type: Schema.Types.ObjectId, ref: "ChatConversation" },
}, { _id: false });

const RedEnvelopeRoundSchema: Schema = new Schema({
  label: { type: String, required: true },
  image: { type: String },
  rewardType: { type: String, enum: ["cash", "item", "gemcoin"], required: true },
  totalAmount: { type: Number },
  totalGemCoins: { type: Number },
  itemId: { type: Schema.Types.ObjectId, ref: "RedEnvelopeItem" },
  conditionAmount: { type: Number, default: 0 },
  conditionLevel: { type: Number, default: 0 },
  maxPeople: { type: Number, required: true, min: 1 },
  scheduledAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  status: { type: String, enum: ["scheduled", "open", "resolved", "cancelled"], default: "scheduled" },
  participants: [ParticipantSchema],
  resolvedAt: { type: Date },
  allocations: { type: [Number], select: false },
  winnerSlot: { type: Number, select: false },
}, { timestamps: { createdAt: true, updatedAt: false } });

RedEnvelopeRoundSchema.index({ scheduledAt: 1 });
RedEnvelopeRoundSchema.index({ "participants.userId": 1 });

if (mongoose.models.RedEnvelopeRound) {
  delete (mongoose as any).models.RedEnvelopeRound;
}
export default mongoose.model<IRedEnvelopeRound>("RedEnvelopeRound", RedEnvelopeRoundSchema);
