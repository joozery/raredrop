import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import RedEnvelopeRound from "@/models/RedEnvelopeRound";
import RedEnvelopeItem from "@/models/RedEnvelopeItem";
import { getOrCreateConversation, appendUserMessage } from "@/lib/chat";

// POST — ผู้โชคดีที่ได้ไอเทมจากซองแดงกดขอรับของ — เปิดเคสแชทในเว็บพร้อมรูปสินค้า (เปิดครั้งเดียว กดซ้ำได้เคสเดิม)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const round = await RedEnvelopeRound.findById(id);
    if (!round) return NextResponse.json({ error: "ไม่พบรอบนี้" }, { status: 404 });
    if (round.rewardType !== "item") {
      return NextResponse.json({ error: "รอบนี้ไม่ใช่รางวัลไอเทม" }, { status: 400 });
    }

    const me = round.participants.find((p: any) => String(p.userId) === String(userId));
    if (!me || !me.isWinner) {
      return NextResponse.json({ error: "คุณไม่ใช่ผู้โชคดีของรอบนี้" }, { status: 400 });
    }

    if (me.claimConversationId) {
      return NextResponse.json({ conversationId: String(me.claimConversationId) });
    }

    const itemDoc = await RedEnvelopeItem.findById(round.itemId).select("name image");

    const convo = await getOrCreateConversation(userId, `รับไอเทมซองแดง: ${itemDoc?.name || round.label}`);

    const summary = [
      `🧧 ขอรับไอเทมจากซองแดง "${round.label}"`,
      `ไอเทม: ${itemDoc?.name || "-"}`,
    ].join("\n");

    await appendUserMessage(convo, summary, itemDoc?.image);

    me.claimConversationId = convo._id as any;
    await round.save();

    return NextResponse.json({ conversationId: String(convo._id) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
