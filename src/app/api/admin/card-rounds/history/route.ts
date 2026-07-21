import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import CardRound from "@/models/CardRound";
import Transaction from "@/models/Transaction";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) return null;
  return session;
}

export async function GET() {
  try {
    if (!(await requireAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectToDatabase();

    const rounds = await CardRound.find({ status: "completed" })
      .sort({ roundNumber: -1 })
      .limit(100)
      .lean();

    if (rounds.length === 0) return NextResponse.json([]);

    const roundIds = rounds.map((r: any) => r._id);

    // รวมยอดจ่ายจริงต่อ round จาก Transaction (amount เป็นลบ = ผู้เล่นจ่าย)
    const txAgg = await Transaction.aggregate([
      { $match: { type: "card_game", referenceId: { $in: roundIds } } },
      {
        $group: {
          _id: "$referenceId",
          revenue: { $sum: { $abs: "$amount" } },
          openCount: { $sum: 1 },
          uniquePlayers: { $addToSet: "$userId" },
        },
      },
    ]);

    const txMap: Record<string, { revenue: number; openCount: number; playerCount: number }> = {};
    for (const t of txAgg) {
      txMap[String(t._id)] = {
        revenue: t.revenue,
        openCount: t.openCount,
        playerCount: t.uniquePlayers.length,
      };
    }

    const history = rounds.map((r: any) => {
      const tx = txMap[String(r._id)] ?? { revenue: 0, openCount: 0, playerCount: 0 };

      const specialCard = r.completedReason === "special"
        ? r.cards.find((c: any) => c.prize?.isSpecial)
        : null;

      return {
        roundNumber: r.roundNumber,
        cardsTotal: r.cards.length,
        cardsOpened: r.cards.filter((c: any) => c.opened).length,
        revenue: tx.revenue,
        openCount: tx.openCount,
        playerCount: tx.playerCount,
        completedAt: r.completedAt ?? r.updatedAt,
        startedAt: r.createdAt,
        completedReason: r.completedReason ?? "all_opened",
        specialPrize: specialCard ? {
          name: specialCard.prize.name,
          title: specialCard.prize.title,
          icon: specialCard.prize.icon,
          openedByName: specialCard.openedByName,
          openedAt: specialCard.openedAt,
        } : null,
      };
    });

    return NextResponse.json(history, { headers: { "Cache-Control": "no-store" } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
