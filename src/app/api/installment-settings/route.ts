import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongoose";
import Setting from "@/models/Setting";

const parseNums = (v: unknown, fallback: number[]) => {
  try {
    const arr = String(v).split(",").map((s) => parseInt(s.trim(), 10)).filter(Boolean);
    return arr.length ? arr : fallback;
  } catch { return fallback; }
};

const DEFAULT_LATE_TIERS_DAILY   = [
  { fromDay: 1, toDay: 3,  ratePercent: 1 },
  { fromDay: 4, toDay: 7,  ratePercent: 2 },
  { fromDay: 8, toDay: 14, ratePercent: 3 },
  { fromDay: 15, toDay: 0, ratePercent: 5 },
];
const DEFAULT_LATE_TIERS_WEEKLY  = [
  { fromDay: 1, toDay: 3, ratePercent: 1 },
  { fromDay: 4, toDay: 7, ratePercent: 2 },
  { fromDay: 8, toDay: 0, ratePercent: 3 },
];
const DEFAULT_LATE_TIERS_MONTHLY = [
  { fromDay: 1,  toDay: 7,  ratePercent: 1 },
  { fromDay: 8,  toDay: 14, ratePercent: 2 },
  { fromDay: 15, toDay: 0,  ratePercent: 3 },
];

const DEFAULT_PLAN_COUNT_MARKUPS = {
  daily:   { "7": 0, "14": 2, "21": 4, "30": 6 },
  weekly:  { "2": 0, "3": 2, "4": 4, "6": 8, "8": 12, "12": 20 },
  monthly: { "2": 0, "3": 5, "6": 15, "12": 35 },
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

    const parseTiers = (key: string, fallback: object[]) => {
      try {
        const v = get(key);
        const parsed = typeof v === "string" ? JSON.parse(v) : v;
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : fallback;
      } catch { return fallback; }
    };

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
      latePenaltyTiers: {
        daily:   parseTiers("installment_late_penalty_tiers_daily",   DEFAULT_LATE_TIERS_DAILY),
        weekly:  parseTiers("installment_late_penalty_tiers_weekly",  DEFAULT_LATE_TIERS_WEEKLY),
        monthly: parseTiers("installment_late_penalty_tiers_monthly", DEFAULT_LATE_TIERS_MONTHLY),
      },
      planCountMarkups: (() => {
        try {
          const v = get("installment_plan_count_markups");
          const parsed = typeof v === "string" ? JSON.parse(v) : v;
          return parsed && typeof parsed === "object" ? parsed : DEFAULT_PLAN_COUNT_MARKUPS;
        } catch { return DEFAULT_PLAN_COUNT_MARKUPS; }
      })(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
