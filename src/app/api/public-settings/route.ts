import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

const PUBLIC_KEYS = [
  "site_logo", "site_name", "site_description", "discord_invite_url",
  "help_line_url", "help_email", "help_phone", "help_facebook_url",
  "help_tiktok_url", "help_youtube_url",
  "hero_banner_image", "hero_banner_link", "hero_banner_title1", "hero_banner_title2", "hero_banner_subtitle",
  "hero_banner_icon", "hero_banner_button1", "hero_banner_button2", "hero_banner_carousel",
  "knowledge_hero_label", "knowledge_hero_image", "knowledge_hero_link", "knowledge_hero_title", "knowledge_hero_subtitle",
  "red_envelope_help_text", "gemcoin_icon",
  "payment_method", "payment_qr_image", "min_topup_amount",
  "popup_enabled", "popup_image", "popup_link", "popup_dismiss_hours",
  "crypto_enabled", "crypto_wallet_address", "crypto_network", "crypto_rate_per_unit",
  "livechat_welcome_message",
];

export async function GET() {
  try {
    await connectToDatabase();
    const settings = await Setting.find({ key: { $in: PUBLIC_KEYS } }).lean();
    const result: Record<string, string> = {};
    for (const s of settings) {
      result[s.key as string] = s.value as string;
    }
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
