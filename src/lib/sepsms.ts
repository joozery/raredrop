const SEPSMS_BASE = "https://sepsms.com/api/v2";

function apiKey() {
  return process.env.SEPSMS_API_KEY || "";
}

// ส่ง OTP ผ่าน SepSMS — คืน reference สำหรับใช้ verify ทีหลัง
export async function sendSmsOtp(phone: string, sender: string): Promise<string> {
  const destination = phone.startsWith("0") ? "66" + phone.slice(1) : phone;

  if (!apiKey()) {
    // dev mode — log เท่านั้น, คืน mock ref
    console.log("==========================================");
    console.log(`[DEV - SEPSMS_API_KEY ไม่ได้ตั้งค่า] mock OTP ไปที่ ${phone}`);
    console.log("==========================================");
    return "DEV_MOCK_REF";
  }

  const res = await fetch(`${SEPSMS_BASE}/otp/send`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      destination,
      origin: sender,
      ttlSeconds: 300,
      codeLength: 6,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || "ส่ง OTP ไม่สำเร็จ");
  }

  // SepSMS ส่งคืน reference ในฟิลด์ result.reference หรือ result.refNo
  const ref = data.result?.reference ?? data.result?.refNo;
  if (!ref) throw new Error("SepSMS ไม่ส่ง reference กลับมา");
  return ref as string;
}

// ตรวจสอบ OTP ที่ผู้ใช้กรอก — คืน true ถ้าถูกต้อง
export async function verifySmsOtp(reference: string, pin: string): Promise<boolean> {
  if (!apiKey() || reference === "DEV_MOCK_REF") {
    return pin === "000000"; // dev fallback
  }

  const res = await fetch(`${SEPSMS_BASE}/otp/verify`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ reference, pin }),
  });

  const data = await res.json();
  return res.ok && data.result?.verified === true;
}
