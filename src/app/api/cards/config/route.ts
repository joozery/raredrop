import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import CardPrize from "@/models/CardPrize";
import Setting from "@/models/Setting";

// config สาธารณะของหน้าสุ่มการ์ดพิเศษ — รางวัลที่เปิดใช้งาน + ค่าเปิดต่อครั้ง
export async function GET() {
  try {
    await connectToDatabase();
    const [prizes, costSetting, backImageSetting, pageBgSetting, completedTitleSetting, completedSubtitleSetting, perRoundSetting] = await Promise.all([
      CardPrize.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).lean(),
      Setting.findOne({ key: "cards_open_cost" }).lean(),
      Setting.findOne({ key: "cards_back_image" }).lean(),
      Setting.findOne({ key: "cards_page_bg" }).lean(),
      Setting.findOne({ key: "cards_completed_title" }).lean(),
      Setting.findOne({ key: "cards_completed_subtitle" }).lean(),
      Setting.findOne({ key: "cards_per_round" }).lean(),
    ]);
    return NextResponse.json({
      cost: Number((costSetting as any)?.value) || 50,
      backImage: (backImageSetting as any)?.value || "",
      pageBg: (pageBgSetting as any)?.value || "",
      cardsPerRound: Math.min(50, Math.max(1, Math.floor(Number((perRoundSetting as any)?.value)) || 10)),
      completedTitle: (completedTitleSetting as any)?.value || "🎉 การ์ดทั้งหมดถูกเปิดออกหมดแล้ว",
      completedSubtitle: (completedSubtitleSetting as any)?.value || "รอแอดมินเปิดรอบใหม่ แล้วกลับมาลุ้นกันอีกครั้ง!",
      prizes: prizes.map((p: any) => ({
        _id: p._id, name: p.name, title: p.title, icon: p.icon, weight: p.weight,
        type: p.type || "custom", amount: p.amount || 0,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
