import sharp from "sharp";
import jsQR from "jsqr";

export interface ThaiQrInfo {
  raw: string;
  type: "promptpay" | "billpayment" | "unknown";
  shopName?: string;
  // ใช้กรอกลง checkReceiver ของ Slip2Go
  accountType?: string;
  accountNumber?: string;
}

const PROMPTPAY_AID = "A000000677010111";
const BILLPAYMENT_AID = "A000000677010112";

function parseTlv(input: string): Map<string, string> {
  const fields = new Map<string, string>();
  let i = 0;
  while (i + 4 <= input.length) {
    const tag = input.slice(i, i + 2);
    const length = parseInt(input.slice(i + 2, i + 4), 10);
    const value = input.slice(i + 4, i + 4 + length);
    fields.set(tag, value);
    i += 4 + length;
  }
  return fields;
}

// แปลงเบอร์มือถือจากฟอร์แมต EMVCo "66xxxxxxxxx" เป็นเบอร์ไทยปกติ "0xxxxxxxxx"
function normalizeMobile(value: string): string {
  return value.startsWith("66") ? "0" + value.slice(2) : value;
}

export function parseThaiQrPayload(raw: string): ThaiQrInfo {
  const top = parseTlv(raw);
  const merchantInfo = top.get("30");
  if (!merchantInfo) return { raw, type: "unknown" };

  const sub = parseTlv(merchantInfo);
  const aid = sub.get("00");

  if (aid === BILLPAYMENT_AID) {
    return {
      raw,
      type: "billpayment",
      // ตาม Slip2Go API doc (Data Description > Account Type List): "03000" = merchant Biller ID
      // (K+ Shop, แม่มณี, Be Merchant NextGen, TTB Smart Shop) ซึ่งเป็นหมวดเดียวกับ QR ถุงเงินที่ใช้ Biller ID
      // (ค่านี้คนละชุดกับ proxy.type ที่ตอบกลับมา เช่น "BILLERID" — ห้ามใช้ค่านั้นเป็น accountType)
      accountType: "03000",
      accountNumber: sub.get("01"), // Biller ID — รหัสบัญชีผู้รับเงินจริง (02/03 เป็น Ref 1/Ref 2 ของรายการ ไม่ใช่บัญชี)
    };
  }

  if (aid === PROMPTPAY_AID) {
    if (sub.has("01")) {
      return { raw, type: "promptpay", accountType: "02001", accountNumber: normalizeMobile(sub.get("01")!) };
    }
    if (sub.has("02")) {
      return { raw, type: "promptpay", accountType: "02003", accountNumber: sub.get("02") };
    }
    if (sub.has("03")) {
      return { raw, type: "promptpay", accountType: "02004", accountNumber: sub.get("03") };
    }
  }

  return { raw, type: "unknown" };
}

export async function decodeQrFromImageBuffer(buffer: Buffer): Promise<string | null> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const result = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  return result?.data ?? null;
}
