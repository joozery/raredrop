import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import { getCurrentRound, serializeRound } from "@/lib/cardGame";

// สถานะรอบปัจจุบัน — สาธารณะ ทุกคนเห็นเหมือนกันว่าใบไหนถูกเปิดไปแล้ว
// status: active = เล่นได้ / completed = เปิดครบแล้ว รอแอดมินเปิดรอบใหม่ / none = ยังไม่เคยเปิดรอบ
export async function GET() {
  try {
    await connectToDatabase();
    const round = await getCurrentRound();
    return NextResponse.json(serializeRound(round), { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
