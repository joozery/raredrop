import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { MongoClient } from "mongodb";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const R2_ACCOUNT_ID = "46a0420e45aab7dbbcc8bceb573e6449";
const R2_ACCESS_KEY_ID = "ad3d24e667c453147782da7897c3a5f6";
const R2_SECRET_ACCESS_KEY = "fe6cdcc28e0efa035244d87dc99003efdc055cf747caf69b32e5b18390e8bb65";
const R2_BUCKET = "droprare";
const R2_PUBLIC_URL = "https://pub-46a0420e45aab7dbbcc8bceb573e6449.r2.dev";
const MONGODB_URI = "mongodb+srv://devwooyou:joozery1234@cluster1.7xi2oge.mongodb.net/raredrop?retryWrites=true&w=majority&appName=Cluster1";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

async function uploadFile(localPath, r2Key, contentType) {
  const buffer = readFileSync(resolve(__dirname, "public", localPath.replace(/^\//, "")));
  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: r2Key,
    Body: buffer,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000",
  }));
  const url = `${R2_PUBLIC_URL}/${r2Key}`;
  console.log(`✅ อัพโหลด ${localPath} → ${url}`);
  return url;
}

async function main() {
  // 1. อัพโหลดไฟล์ขึ้น R2
  const imgUrl = await uploadFile("/product/pokemon.webp", "seed/pokemon.webp", "image/webp");
  const animUrl = await uploadFile("/animationbox.mp4", "seed/animationbox.mp4", "video/mp4");

  // 2. อัพเดต MongoDB
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("raredrop");

  // อัพเดต items — image ที่เป็น local path
  const itemRes = await db.collection("items").updateMany(
    { image: { $regex: "^/product/" } },
    { $set: { image: imgUrl } }
  );
  console.log(`📦 อัพเดต items.image: ${itemRes.modifiedCount} รายการ`);

  // อัพเดต items — animation ที่เป็น local path
  const itemAnimRes = await db.collection("items").updateMany(
    { animation: { $regex: "^/" } },
    { $set: { animation: animUrl } }
  );
  console.log(`🎬 อัพเดต items.animation: ${itemAnimRes.modifiedCount} รายการ`);

  // อัพเดต boxes — image
  const boxImgRes = await db.collection("boxes").updateMany(
    { image: { $regex: "^/product/" } },
    { $set: { image: imgUrl } }
  );
  console.log(`📦 อัพเดต boxes.image: ${boxImgRes.modifiedCount} รายการ`);

  // อัพเดต boxes — animation
  const boxAnimRes = await db.collection("boxes").updateMany(
    { animation: { $regex: "^/" } },
    { $set: { animation: animUrl } }
  );
  console.log(`🎬 อัพเดต boxes.animation: ${boxAnimRes.modifiedCount} รายการ`);

  await client.close();
  console.log("\n🎉 เสร็จสิ้น! ข้อมูลทั้งหมดชี้ไป R2 แล้ว");
}

main().catch(console.error);
