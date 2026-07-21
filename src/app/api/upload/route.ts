import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "video/mp4", "video/webm"];
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]; // แปลงเป็น WebP (gif/video คงรูปแบบเดิม)
const MAX_SIZE = 50 * 1024 * 1024; // 50MB

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["admin", "super_admin"].includes((session.user as any)?.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const folder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "ประเภทไฟล์ไม่รองรับ (jpg, png, webp, gif, mp4, webm เท่านั้น)" }, { status: 400 });
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "ไฟล์ใหญ่เกิน 50MB" }, { status: 400 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let contentType = file.type;
    let ext = file.name.split(".").pop()?.toLowerCase() || "bin";

    // แปลง jpg/png/webp → WebP ก่อนอัปโหลด
    if (IMAGE_TYPES.includes(file.type)) {
      buffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      contentType = "image/webp";
      ext = "webp";
    }

    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    await r2.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000",
      })
    );

    const url = `${R2_PUBLIC_URL}/${key}`;
    return NextResponse.json({ url, key });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
  }
}
