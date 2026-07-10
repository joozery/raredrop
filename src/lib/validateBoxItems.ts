// เรทของแต่ละไอเทมคือ "น้ำหนัก" ในการสุ่ม — โอกาสออกจริง = เรท / ยอดรวมของตัวที่ไม่ล็อก
// จึงไม่บังคับให้รวมเป็น 100% (เอนจินและ % หน้าร้านคิดสัดส่วนจากยอดรวมอัตโนมัติ)
// แต่ยอดรวมต้องมากกว่า 0 — total = 0 ทำให้ weightedRandom คืนไอเทมตัวแรกเสมอ 100%
export function validateBoxItems(items: unknown): string | null {
  if (items === undefined) return null; // ไม่ได้ส่ง items มา = ไม่ได้แก้เรท
  if (!Array.isArray(items)) return "รูปแบบข้อมูลไอเทมไม่ถูกต้อง";
  if (items.length === 0) return null; // กล่องว่างอนุญาต (เปิดไม่ได้อยู่แล้ว)

  for (const i of items) {
    if (typeof i?.probability !== "number" || isNaN(i.probability) || i.probability < 0) {
      return "อัตราดรอปของแต่ละไอเทมต้องเป็นตัวเลขและไม่ติดลบ";
    }
  }

  const unlocked = items.filter((i: any) => !i.isLocked);
  if (unlocked.length === 0) {
    return "ต้องมีไอเทมที่ไม่ถูกพัก (ล็อก) อย่างน้อย 1 ชิ้น ไม่เช่นนั้นกล่องจะสุ่มไม่ได้";
  }

  const total = unlocked.reduce((sum: number, i: any) => sum + i.probability, 0);
  if (total <= 0) {
    return "อัตราดรอปรวมของไอเทมที่ไม่ถูกพักต้องมากกว่า 0%";
  }

  return null;
}
