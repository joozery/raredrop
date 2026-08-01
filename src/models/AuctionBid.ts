import mongoose, { Schema, Document, Types } from "mongoose";

export interface IAuctionBid extends Document {
  auctionId: Types.ObjectId;
  userId: Types.ObjectId;
  displayName: string;
  amount: number;
  createdAt: Date;
}

const AuctionBidSchema = new Schema<IAuctionBid>({
  auctionId:   { type: Schema.Types.ObjectId, ref: "Auction", required: true },
  userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  displayName: { type: String, required: true },
  amount:      { type: Number, required: true },
}, { timestamps: true });

AuctionBidSchema.index({ auctionId: 1, createdAt: -1 });

if (mongoose.models.AuctionBid) delete (mongoose as any).models.AuctionBid;
export default mongoose.model<IAuctionBid>("AuctionBid", AuctionBidSchema);
