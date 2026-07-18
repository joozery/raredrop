import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import CardRound from "@/models/CardRound";

// ประวัติการเปิดการ์ด — สาธารณะ: ใครเปิดใบไหนได้รางวัลอะไร เรียงล่าสุดก่อน
export async function GET() {
  try {
    await connectToDatabase();
    const rounds = await CardRound.find({})
      .sort({ roundNumber: -1 })
      .limit(20)
      .lean();

    const entries = rounds
      .flatMap((r: any) =>
        r.cards
          .map((c: any, i: number) => ({ ...c, index: i, roundNumber: r.roundNumber }))
          .filter((c: any) => c.opened && c.prize)
      )
      .map((c: any) => ({
        roundNumber: c.roundNumber,
        cardIndex: c.index,
        openedBy: c.openedBy ? String(c.openedBy) : undefined,
        openedByName: c.openedByName || "ผู้เล่น",
        openedAt: c.openedAt || null,
        prize: { title: c.prize.title, name: c.prize.name, icon: c.prize.icon || "" },
      }))
      .sort((a: any, b: any) => new Date(b.openedAt || 0).getTime() - new Date(a.openedAt || 0).getTime())
      .slice(0, 100);

    return NextResponse.json({ entries }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
