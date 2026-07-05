const CHAT_WEBHOOK = process.env.DISCORD_CHAT_WEBHOOK_URL;

export async function notifyDiscordChat({
  userName,
  userEmail,
  conversationId,
  text,
  imageUrl,
  isNew,
}: {
  userName?: string;
  userEmail?: string;
  conversationId: string;
  text?: string;
  imageUrl?: string;
  isNew?: boolean;
}) {
  if (!CHAT_WEBHOOK) return;

  const displayName = userName || userEmail || "ลูกค้า";
  const preview = text ? (text.length > 200 ? text.slice(0, 200) + "…" : text) : imageUrl ? "📷 ส่งรูปภาพ" : "";
  const adminUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/admin/chat/${conversationId}`;

  const embed = {
    color: isNew ? 0xe74c3c : 0x3498db,
    author: { name: displayName },
    title: isNew ? "💬 แชทใหม่จากลูกค้า" : "💬 ข้อความใหม่จากลูกค้า",
    description: preview || "(ไม่มีข้อความ)",
    fields: [
      { name: "ผู้ส่ง", value: userEmail || "-", inline: true },
      { name: "ลิงก์แชท", value: `[เปิดแชท](${adminUrl})`, inline: true },
    ],
    timestamp: new Date().toISOString(),
  };

  try {
    await fetch(CHAT_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ embeds: [embed] }),
    });
  } catch {
    // ไม่ block request ถ้า Discord ล่ม
  }
}
