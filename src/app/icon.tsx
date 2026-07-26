import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

export default async function Icon() {
  const logoPath = path.join(process.cwd(), "public", "logo.jpeg");
  const logoData = await readFile(logoPath);
  const logoBase64 = `data:image/jpeg;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 32,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoBase64}
          width={160}
          height={160}
          style={{ objectFit: "contain" }}
          alt="icon"
        />
      </div>
    ),
    { ...size },
  );
}
