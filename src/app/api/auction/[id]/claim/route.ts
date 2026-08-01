import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongoose";
import Auction from "@/models/Auction";
import { getOrCreateConversation, appendUserMessage } from "@/lib/chat";
import { notifyDiscordChat } from "@/lib/discordNotify";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: "กรุณาเข้าสู่ระบบ" }, { status: 401 });

    const { id } = await params;
    await connectToDatabase();

    const auction = await Auction.findOne({ _id: id, winnerId: userId, status: "ended" });
    if (!auction) return NextResponse.json({ error: "ไม่พบรายการประมูลที่ชนะ" }, { status: 404 });

    auction.winnerClaimed = true;
    await auction.save();

    let conversationId: string | null = null;
    try {
      const winBid = auction.winnerBid || auction.currentBid;
      const gameImage = (auction.gameImages?.[0] || auction.gameImage) || undefined;
      const highlights = (auction.highlights || []).filter(Boolean);

      const chatText = [
        `🏆 แจ้งรับรางวัลการประมูล`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `📦 รายการ: ${auction.title}`,
        auction.tag ? `🎮 เกม: ${auction.tag}${auction.server ? ` | Server: ${auction.server}` : ""}` : "",
        auction.accountLevel ? `⭐ ระดับ Account: Lv.${auction.accountLevel}` : "",
        `💰 ราคาที่ชนะ: ฿${winBid.toLocaleString()}`,
        highlights.length ? `✨ จุดเด่น: ${highlights.join(", ")}` : "",
        auction.description ? `📝 รายละเอียด: ${auction.description}` : "",
        `━━━━━━━━━━━━━━━━━━━━`,
        `กรุณาประสานงานการส่งมอบสินค้าด้วยครับ/ค่ะ`,
      ].filter(Boolean).join("\n");

      const convo = await getOrCreateConversation(userId, `🏆 ชนะประมูล: ${auction.title}`);
      await appendUserMessage(convo, chatText, gameImage);
      conversationId = String(convo._id);

      const user = (session?.user || {}) as any;
      notifyDiscordChat({
        userName: user.name,
        userEmail: user.email,
        conversationId,
        text: chatText,
        imageUrl: gameImage,
        isNew: true,
      }).catch(() => {});
    } catch {}

    return NextResponse.json({ success: true, conversationId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
