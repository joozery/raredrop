import mongoose, { Schema, Document, Types } from "mongoose";

export interface IInstallmentItem {
  installmentNo: number;
  amount: number;
  dueDate: string;
  status: "pending" | "paid";
  paidAt?: string;
  slipUrl?: string;
  confirmedBy?: string;
}

export interface IInstallmentBill extends Document {
  billId: string;
  productCode: string;
  totalPrice: number;
  downPercent: number;
  downAmount: number;
  remainingAmount: number;
  planType: "daily" | "weekly" | "monthly";
  planCount: number;
  amountPerInstallment: number;
  installments: IInstallmentItem[];
  status: "pending" | "active" | "completed" | "cancelled";
  deviceId: string;
  userId?: Types.ObjectId;
  shopListingId?: Types.ObjectId;
  reservedAccountId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const InstallmentItemSchema = new Schema<IInstallmentItem>({
  installmentNo: { type: Number, required: true },
  amount:        { type: Number, required: true },
  dueDate:       { type: String, required: true },
  status:        { type: String, enum: ["pending", "paid"], default: "pending" },
  paidAt:        { type: String },
  slipUrl:       { type: String },
  confirmedBy:   { type: String },
}, { _id: false });

const InstallmentBillSchema = new Schema<IInstallmentBill>({
  billId:               { type: String, required: true, unique: true, index: true },
  productCode:          { type: String, required: true, index: true },
  totalPrice:           { type: Number, required: true },
  downPercent:          { type: Number, required: true },
  downAmount:           { type: Number, required: true },
  remainingAmount:      { type: Number, required: true },
  planType:             { type: String, enum: ["daily", "weekly", "monthly"], required: true },
  planCount:            { type: Number, required: true },
  amountPerInstallment: { type: Number, required: true },
  installments:         { type: [InstallmentItemSchema], required: true },
  status:               { type: String, enum: ["pending", "active", "completed", "cancelled"], default: "pending" },
  deviceId:             { type: String, required: true, index: true },
  userId:               { type: Schema.Types.ObjectId, ref: "User", index: true },
  shopListingId:        { type: Schema.Types.ObjectId, ref: "ShopListing" },
  reservedAccountId:    { type: Schema.Types.ObjectId },
}, { timestamps: true });

if (mongoose.models.InstallmentBill) {
  delete (mongoose as any).models.InstallmentBill;
}
export default mongoose.model<IInstallmentBill>("InstallmentBill", InstallmentBillSchema);
