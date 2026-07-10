// อัตราดรอปรวมของไอเทมที่ "ไม่ล็อก" ต้องเท่ากับ 100% เป๊ะ — total = 0 ทำให้ weightedRandom คืนไอเทมตัวแรกเสมอ
// และ total ≠ 100 ทำให้ % ที่โชว์ผู้ใช้ไม่ตรงกับโอกาสออกจริง
// ไอเทมที่ล็อก (isLocked) ถูกตัดออกจากการสุ่มและ % หน้าร้าน จึงไม่นับรวมที่นี่
// UI กรอกละเอียดสุด 0.0001 จึงใช้ tolerance ครึ่งหนึ่งของ step — จับพลาดระดับ 0.0001 ได้ แต่ปล่อย float error (~1e-13) ผ่าน
const TOLERANCE = 0.00005;

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
  if (Math.abs(total - 100) > TOLERANCE) {
    return `อัตราดรอปรวมของไอเทมที่ไม่ถูกพักต้องเท่ากับ 100% (ปัจจุบัน ${parseFloat(total.toFixed(4))}%)`;
  }

  return null;
}
