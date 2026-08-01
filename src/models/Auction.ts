import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuction extends Document {
  title: string;
  gameImage: string;
  gameImages: string[];
  accountLevel: number;
  description: string;
  highlights: string[];
  tag: string;
  tagColor: string;
  server: string;
  startBid: number;
  currentBid: number;
  minBidStep: number;
  endsAt: Date;
  status: "active" | "ended" | "cancelled";
  isHot: boolean;
  verified: boolean;
  winnerId?: Types.ObjectId;
  winnerBid?: number;
  winnerClaimed?: boolean;
  topBidder?: string;
  totalBids: number;
  createdAt: Date;
  updatedAt: Date;
}

const AuctionSchema = new Schema<IAuction>({
  title:        { type: String, required: true },
  gameImage:    { type: String, default: "" },
  gameImages:   [{ type: String }],
  accountLevel: { type: Number, default: 1 },
  description:  { type: String, default: "" },
  highlights:   [{ type: String }],
  tag:          { type: String, default: "" },
  tagColor:     { type: String, default: "#6b7280" },
  server:       { type: String, default: "TH" },
  startBid:     { type: Number, required: true, min: 0 },
  currentBid:   { type: Number, default: 0 },
  minBidStep:   { type: Number, default: 100, min: 1 },
  endsAt:       { type: Date, required: true },
  status:       { type: String, enum: ["active", "ended", "cancelled"], default: "active" },
  isHot:        { type: Boolean, default: false },
  verified:     { type: Boolean, default: true },
  winnerId:     { type: Schema.Types.ObjectId, ref: "User" },
  winnerBid:    { type: Number },
  winnerClaimed:{ type: Boolean, default: false },
  topBidder:    { type: String },
  totalBids:    { type: Number, default: 0 },
}, { timestamps: true });

if (mongoose.models.Auction) delete (mongoose as any).models.Auction;
export default mongoose.model<IAuction>("Auction", AuctionSchema);
