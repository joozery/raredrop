import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const alt = "LuxusX - กล่องสุ่มสินค้าพรีเมียม";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const logoPath = path.join(process.cwd(), "public", "logo.jpeg");
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f0f0f 0%, #1a0000 50%, #0f0f0f 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* วงกลมตกแต่งพื้นหลัง */}
        <div
          style={{
            position: "absolute",
            top: -150,
            right: -150,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -100,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(220,38,38,0.1) 0%, transparent 70%)",
            display: "flex",
          }}
        />

        {/* โลโก้ */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={180}
          height={176}
          style={{ objectFit: "contain", marginBottom: 32 }}
          alt="logo"
        />

        {/* ชื่อเว็บ */}
        <div
          style={{
            fontSize: 80,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-2px",
            lineHeight: 1,
            marginBottom: 16,
            display: "flex",
          }}
        >
          LuxusX
        </div>

        {/* tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(255,255,255,0.65)",
            fontWeight: 400,
            display: "flex",
          }}
        >
          กล่องสุ่มสินค้าพรีเมียมออนไลน์
        </div>

        {/* เส้นสีแดงด้านล่าง */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, transparent, #dc2626, #ef4444, #dc2626, transparent)",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size },
  );
}
