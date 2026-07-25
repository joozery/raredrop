import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

const parseNums = (v: unknown, fallback: number[]) => {
  try {
    const arr = String(v).split(",").map((s) => parseInt(s.trim(), 10)).filter(Boolean);
    return arr.length ? arr : fallback;
  } catch { return fallback; }
};

const DEFAULT_PRICE_RANGES = [
  { id: "r1", priceMin: 1000, priceMax: 2999, markupDaily: 10, markupWeekly: 20, markupMonthly: 25, enableMonthly: false },
  { id: "r2", priceMin: 3000, priceMax: 3999, markupDaily: 35, markupWeekly: 25, markupMonthly: 20, enableMonthly: false },
  { id: "r3", priceMin: 4000, priceMax: 4999, markupDaily: 35, markupWeekly: 25, markupMonthly: 20, enableMonthly: true },
  { id: "r4", priceMin: 5000, priceMax: 9999, markupDaily: 30, markupWeekly: 20, markupMonthly: 15, enableMonthly: true },
];

export async function GET() {
  try {
    await connectToDatabase();
    const rows = await Setting.find({
      key: { $regex: /^installment_/ },
    }).lean();

    const get = (key: string) => rows.find((r) => r.key === key)?.value;

    const terms = (() => {
      try { return JSON.parse(get("installment_terms") as string); } catch { return []; }
    })();

    const priceRanges = (() => {
      try {
        const v = get("installment_price_ranges");
        const parsed = typeof v === "string" ? JSON.parse(v) : v;
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_PRICE_RANGES;
      } catch { return DEFAULT_PRICE_RANGES; }
    })();

    const howtoSteps = (() => {
      try {
        const v = get("installment_howto_steps");
        const parsed = typeof v === "string" ? JSON.parse(v) : v;
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
      } catch { return null; }
    })();

    return NextResponse.json({
      enabled:       get("installment_enabled") ?? true,
      lineUrl:       get("installment_line_url") ?? "https://line.me/ti/p/~@352eusln",
      coverImage:    get("installment_cover_image") ?? "",
      downOptions:   parseNums(get("installment_down_options"), [10, 40, 50, 80]),
      markups: {
        daily:   Number(get("installment_markup_daily")   ?? 0)  / 100,
        weekly:  Number(get("installment_markup_weekly")  ?? 5)  / 100,
        monthly: Number(get("installment_markup_monthly") ?? 10) / 100,
      },
      planOptions: {
        daily:   parseNums(get("installment_daily_options"),   [7, 14, 21, 30]),
        weekly:  parseNums(get("installment_weekly_options"),  [2, 3, 4, 6, 8, 12]),
        monthly: parseNums(get("installment_monthly_options"), [2, 3, 4, 6, 12]),
      },
      terms,
      priceRanges,
      howtoSteps,
    }, {
      headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=120" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
