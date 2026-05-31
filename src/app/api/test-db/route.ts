import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    return NextResponse.json({ status: "success", message: "Connected to MongoDB successfully!" }, { status: 200 });
  } catch (error: any) {
    console.error("Database connection failed:", error);
    return NextResponse.json({ status: "error", message: "Failed to connect to MongoDB", error: error.message }, { status: 500 });
  }
}
