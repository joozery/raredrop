import CardRound from "@/models/CardRound";

export const TOTAL_CARDS = 10;

// รอบล่าสุดที่จะโชว์หน้าเว็บ — รอบ active ถ้ามี ไม่งั้นรอบที่จบไปแล้วล่าสุด (null = ยังไม่เคยเปิดรอบเลย)
// รอบใหม่ไม่สร้างอัตโนมัติ — แอดมินเป็นคนกดเปิด event จากหลังบ้าน (/admin/cards)
export async function getCurrentRound() {
  const active = await CardRound.findOne({ status: "active" }).sort({ roundNumber: -1 });
  if (active) return active;
  return CardRound.findOne().sort({ roundNumber: -1 });
}

// เปิดรอบใหม่ — เรียกจาก API หลังบ้านเท่านั้น
// รับ snapshot รางวัล 10 ตัว (1 รางวัล : 1 ใบ ไม่ซ้ำ) แล้วคละตำแหน่งลงการ์ดให้
export async function startNewRound(assigned: any[]) {
  const shuffled = [...assigned];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const last = await CardRound.findOne().sort({ roundNumber: -1 }).lean();
  return CardRound.create({
    roundNumber: ((last as any)?.roundNumber || 0) + 1,
    cards: shuffled.map((a) => ({ opened: false, assigned: a })),
    status: "active",
  });
}

export function serializeRound(round: any) {
  // ยังไม่เคยเปิดรอบ — client โชว์การ์ดคว่ำเฉย ๆ พร้อมข้อความรอแอดมินเปิดรอบ
  if (!round) return { _id: null, roundNumber: 0, status: "none", cards: [], prizes: [] };

  // รายการรางวัลทั้งหมดของรอบนี้ (โชว์ให้ผู้เล่นรู้ว่ามีอะไรให้ลุ้น) — จงใจ sort ใหม่
  // ตัดความเชื่อมโยงกับตำแหน่งการ์ด จะได้เดาไม่ได้ว่ารางวัลไหนอยู่ใบไหน
  const prizes = round.cards
    .map((c: any) => ({ src: c.assigned || c.prize, taken: !!c.opened }))
    .filter((e: any) => e.src)
    .map((e: any) => ({
      title: e.src.title,
      name: e.src.name,
      icon: e.src.icon || "",
      type: e.src.type || "custom",
      amount: e.src.amount || 0,
      taken: e.taken,
    }))
    .sort((a: any, b: any) =>
      Number(a.taken) - Number(b.taken) || b.amount - a.amount || String(a.name).localeCompare(String(b.name))
    );

  return {
    _id: String(round._id),
    roundNumber: round.roundNumber,
    status: round.status,
    prizes,
    cards: round.cards.map((c: any) => ({
      opened: !!c.opened,
      openedBy: c.openedBy ? String(c.openedBy) : undefined,
      openedByName: c.openedByName || undefined,
      prize: c.prize
        ? { title: c.prize.title, name: c.prize.name, icon: c.prize.icon, type: c.prize.type, amount: c.prize.amount }
        : undefined,
    })),
  };
}
