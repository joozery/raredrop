import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { decodeQrFromImageBuffer, parseThaiQrPayload } from "@/lib/thaiQr";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "ไม่พบ URL รูปภาพ" }, { status: 400 });
    }

    const imageRes = await fetch(imageUrl);
    if (!imageRes.ok) {
      return NextResponse.json({ error: "ดึงรูปภาพไม่สำเร็จ" }, { status: 400 });
    }
    const buffer = Buffer.from(await imageRes.arrayBuffer());

    const raw = await decodeQrFromImageBuffer(buffer);
    if (!raw) {
      return NextResponse.json({ error: "อ่าน QR Code จากรูปภาพไม่สำเร็จ กรุณาตรวจสอบความชัดของรูป" }, { status: 400 });
    }

    const info = parseThaiQrPayload(raw);
    if (info.type === "unknown") {
      return NextResponse.json({ error: "ไม่รู้จักรูปแบบ QR นี้ (ไม่ใช่ PromptPay หรือ Thai QR Bill Payment)" }, { status: 400 });
    }

    return NextResponse.json(info);
  } catch (error: any) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + error.message }, { status: 500 });
  }
}
