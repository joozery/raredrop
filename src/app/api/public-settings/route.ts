import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

const PUBLIC_KEYS = ["site_logo", "site_name", "site_description", "discord_invite_url"];

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Setting.find({ key: { $in: PUBLIC_KEYS } }).lean();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key as string] = s.value as string;
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
