"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCheck, Lock, Gift, Zap, Package, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

interface LevelItem { _id: string; name: string; image: string }
interface LevelConfig {
  _id: string;
  level: number;
  xpRequired: number;
  tagImage?: string;
  logoImage?: string;
  colorTheme?: string;
  rewardItems: { itemId: LevelItem; quantity: number }[];
}

const PRESET: Record<string, { from: string; to: string; border: string; pill: string; bar: string }> = {
  gold:    { from: "#F59E0B", to: "#FCD34D", border: "#F59E0B", pill: "#FEF3C7", bar: "#F59E0B" },
  silver:  { from: "#94A3B8", to: "#CBD5E1", border: "#94A3B8", pill: "#F1F5F9", bar: "#94A3B8" },
  bronze:  { from: "#EA580C", to: "#FB923C", border: "#EA580C", pill: "#FFF7ED", bar: "#EA580C" },
  diamond: { from: "#06B6D4", to: "#818CF8", border: "#06B6D4", pill: "#ECFEFF", bar: "#06B6D4" },
  gray:    { from: "#9CA3AF", to: "#D1D5DB", border: "#9CA3AF", pill: "#F3F4F6", bar: "#9CA3AF" },
};

function theme(colorTheme?: string) {
  if (!colorTheme) return PRESET.gray;
  return PRESET[colorTheme] ?? { from: colorTheme, to: colorTheme, border: colorTheme, pill: colorTheme + "22", bar: colorTheme };
}

export default function LevelsPage() {
  const router = useRouter();
  const [xp, setXp] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [claimedLevels, setClaimedLevels] = useState<number[]>([]);
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; ok: boolean; claimedMsg?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/user/levels")
      .then((r) => r.json())
      .then((d) => {
        setXp(d.xp || 0);
        setCurrentLevel(d.currentLevel || 1);
        setClaimedLevels(d.claimedLevels || []);
        setLevels(d.levels || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleClaimReward = async (lv: LevelConfig) => {
    if (claimingId) return;
    setClaimingId(lv._id);
    try {
      const res = await fetch("/api/user/levels/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: lv._id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setToast({ msg: data.error || "เกิดข้อผิดพลาดในการกดรับรางวัล", ok: false });
        setTimeout(() => setToast(null), 3500);
        return;
      }

      setClaimedLevels((prev) => [...prev, lv.level]);
      setToast({ msg: data.message || `รับของรางวัลเลเวล ${lv.level} สำเร็จ!`, ok: true, claimedMsg: true });
      setTimeout(() => setToast(null), 5000);
    } catch {
      setToast({ msg: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง", ok: false });
      setTimeout(() => setToast(null), 3500);
    } finally {
      setClaimingId(null);
    }
  };

  const curIdx = levels.reduce((acc, l, i) => (xp >= l.xpRequired ? i : acc), -1);
  const curLv = levels[curIdx] ?? null;
  const nextLv = levels[curIdx + 1] ?? null;
  const baseXp = curLv ? curLv.xpRequired : 0;
  const pct = nextLv
    ? Math.min(100, Math.max(0, ((xp - baseXp) / (nextLv.xpRequired - baseXp)) * 100))
    : curLv ? 100 : 0;
  const t = theme(curLv?.colorTheme);

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-24 relative">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(to right, ${t.from}, ${t.to})` }}
        />

        <div className="px-4 pt-5 pb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm font-medium mb-5 transition-colors cursor-pointer"
          >
            <ChevronLeft size={17} /> กลับ
          </button>

          <div className="flex items-center gap-4 mb-5">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md relative"
              style={{ background: `linear-gradient(135deg, ${t.from}, ${t.to})` }}
            >
              {curLv?.tagImage
                ? <img src={curLv.tagImage} alt="" className="w-11 h-11 object-contain drop-shadow" />
                : <img src="/logo.jpeg" alt="Level" className="w-11 h-11 object-cover rounded-full shadow-sm bg-white" />}
              {curLv?.logoImage && (
                <img src={curLv.logoImage} alt="" className="absolute -right-2 -top-2 w-10 h-10 object-contain opacity-60 pointer-events-none" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 font-semibold mb-0.5">ระดับของคุณ</p>
              <p className="text-2xl font-black text-gray-900 leading-none mb-1">Lv.{currentLevel}</p>
              <div className="flex items-center gap-1.5">
                <Zap size={12} className="text-amber-500" />
                <span className="text-sm font-bold text-gray-700">{xp.toLocaleString()} XP</span>
                {nextLv && (
                  <span className="text-xs text-gray-400 font-medium">
                    · เหลืออีก {(nextLv.xpRequired - xp).toLocaleString()} XP เพื่อ Lv.{nextLv.level}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* progress bar */}
          {nextLv && (
            <div>
              <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1.5">
                <span>Lv.{curLv?.level ?? 1} · {curLv?.xpRequired.toLocaleString() ?? 0} XP</span>
                <span>Lv.{nextLv.level} · {nextLv.xpRequired.toLocaleString()} XP</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
                  style={{ width: `${pct}%`, background: `linear-gradient(to right, ${t.from}, ${t.to})` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                </div>
              </div>
              <p className="text-right text-[10px] text-gray-400 font-bold mt-1">{pct.toFixed(1)}%</p>
            </div>
          )}
          {!nextLv && curLv && (
            <div className="text-center py-2 text-amber-600 text-sm font-bold">🎉 เลเวลสูงสุดแล้ว!</div>
          )}
        </div>
      </div>

      {/* ── List ── */}
      <div className="px-4 pt-4 flex flex-col gap-2 max-w-4xl mx-auto w-full">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            ทั้งหมด {levels.length} เลเวล
          </p>
          <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1">
            <Zap size={11} className="text-amber-500" /> เติม 1฿ = 1XP
          </span>
        </div>

        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-2xl bg-gray-200 animate-pulse" />
            ))
          : levels.map((lv, idx) => {
              const next = levels[idx + 1];
              const unlocked = xp >= lv.xpRequired;
              const isCur = unlocked && (!next || xp < next.xpRequired);
              const isClaimed = claimedLevels.includes(lv.level);
              const hasRewards = lv.rewardItems?.length > 0;
              const xpRange = next ? next.xpRequired - lv.xpRequired : null;
              const lvPct = isCur && xpRange
                ? Math.min(100, ((xp - lv.xpRequired) / xpRange) * 100)
                : 0;
              const needed = lv.xpRequired - xp;
              const ltheme = theme(lv.colorTheme);

              return (
                <div
                  key={lv._id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-all ${
                    isCur ? "shadow-md border-2" : "shadow-sm border"
                  }`}
                  style={{ borderColor: isCur ? ltheme.border : "#E5E7EB" }}
                >
                  {/* top accent bar */}
                  {isCur && (
                    <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${ltheme.from}, ${ltheme.to})` }} />
                  )}

                  <div className="p-3.5 flex items-center gap-3">
                    {/* badge */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        background: isCur
                          ? `linear-gradient(135deg, ${ltheme.from}, ${ltheme.to})`
                          : unlocked
                          ? `linear-gradient(135deg, ${ltheme.from}30, ${ltheme.to}50)`
                          : "#F3F4F6",
                        border: `1.5px solid ${isCur ? ltheme.border : unlocked ? ltheme.border + "60" : "#E5E7EB"}`,
                      }}
                    >
                      {lv.tagImage ? (
                        <img src={lv.tagImage} alt="" className="w-7 h-7 object-contain" />
                      ) : (
                        <img src="/logo.jpeg" alt="Level" className="w-7 h-7 object-cover rounded-full" />
                      )}
                    </div>

                    {/* info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-black text-sm text-gray-900">Lv.{lv.level}</span>
                        {isCur && (
                          <span
                            className="text-[9px] font-black px-2 py-0.5 rounded-full"
                            style={{ background: ltheme.pill, color: ltheme.from }}
                          >
                            ระดับปัจจุบัน
                          </span>
                        )}
                        {!isCur && unlocked && <CheckCheck size={13} className="text-emerald-500" />}
                        {!unlocked && <Lock size={11} className="text-gray-400" />}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-gray-500">
                        <span className="font-semibold">{lv.xpRequired.toLocaleString()} XP รวม</span>
                        <span className="text-gray-400">· เติม 1฿ = 1XP</span>
                      </div>

                      {isCur && xpRange && (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${lvPct}%`, background: `linear-gradient(to right, ${ltheme.from}, ${ltheme.to})` }} />
                          </div>
                          <span className="text-[10px] font-bold shrink-0" style={{ color: ltheme.from }}>
                            เหลือ {(next!.xpRequired - xp).toLocaleString()} XP
                          </span>
                        </div>
                      )}

                      {!unlocked && (
                        <p className="text-[10px] text-gray-500 font-semibold mt-0.5">ขาดอีก {needed.toLocaleString()} XP</p>
                      )}
                    </div>

                    {/* rewards & claim action */}
                    {hasRewards && (
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1">
                          <Gift size={10} className="text-amber-500" />
                          <span className="text-[9px] font-bold text-gray-500">รางวัล</span>
                        </div>

                        <div className="flex gap-1 mb-1">
                          {lv.rewardItems.slice(0, 3).map((r, i) => (
                            <div key={i} className="relative w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
                              <img src={r.itemId?.image} alt={r.itemId?.name} className="w-full h-full object-contain p-0.5" />
                              {r.quantity > 1 && (
                                <span className="absolute bottom-0 right-0 text-[7px] font-black bg-black/60 text-white px-0.5 rounded-tl leading-tight">×{r.quantity}</span>
                              )}
                            </div>
                          ))}
                          {lv.rewardItems.length > 3 && (
                            <div className="w-9 h-9 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center text-[9px] font-bold text-gray-400">
                              +{lv.rewardItems.length - 3}
                            </div>
                          )}
                        </div>

                        {/* Claim Button Logic */}
                        {unlocked ? (
                          isClaimed ? (
                            <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCheck size={12} /> รับแล้ว
                            </span>
                          ) : (
                            <button
                              onClick={() => handleClaimReward(lv)}
                              disabled={claimingId === lv._id}
                              className="text-xs font-extrabold text-white bg-red-600 hover:bg-red-700 active:scale-95 px-3 py-1.5 rounded-xl shadow-md shadow-red-600/20 flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <Gift size={13} />
                              {claimingId === lv._id ? "กำลังรับ..." : "กดรับรางวัล"}
                            </button>
                          )
                        ) : (
                          <span className="text-[10px] text-gray-400 font-semibold flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md">
                            <Lock size={10} /> ล็อก
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-2xl font-bold text-xs text-white flex items-center gap-3 whitespace-nowrap border ${toast.ok ? "bg-slate-900 border-slate-800" : "bg-red-600 border-red-500"}`}>
          {toast.ok ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} />}
          <span>{toast.msg}</span>

          {toast.claimedMsg && (
            <Link
              href="/inventory"
              className="ml-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-black flex items-center gap-1 transition-colors"
            >
              <Package size={12} /> ไปที่ Inventory <ArrowRight size={11} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
