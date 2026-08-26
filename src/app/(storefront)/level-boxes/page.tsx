"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Award, Gift, Lock, CheckCircle2, AlertCircle, ArrowRight, Sparkles, Check, Package, Flame } from "lucide-react";
import { MediaImage } from "@/components/ui/MediaImage";

interface RarityInfo { name: string; color: string; order: number }
interface ItemInfo { _id: string; name: string; image: string; type?: "item" | "coin_reward"; coinRewardAmount?: number; rarityId?: RarityInfo }
interface BoxItem { itemId: ItemInfo; probability: number; isLocked?: boolean }
interface BoxInfo { _id: string; name: string; image: string; price: number; items?: BoxItem[] }
interface Milestone { minLevel: number; box: BoxInfo; unlocked: boolean; isCurrent: boolean }

interface LevelBoxData {
  level: number;
  reward: { minLevel: number; box: BoxInfo } | null;
  claimedToday: boolean;
  resetAt: string;
  milestones: Milestone[];
}

function useCountdown(resetAt?: string) {
  const [parts, setParts] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    if (!resetAt) return;
    const target = new Date(resetAt).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setParts({ h: String(h).padStart(2, "0"), m: String(m).padStart(2, "0"), s: String(s).padStart(2, "0") });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [resetAt]);
  return parts;
}

function CountdownDigits({ resetAt }: { resetAt?: string }) {
  const { h, m, s } = useCountdown(resetAt);
  return (
    <div className="flex items-center gap-1">
      {[h, m, s].map((v, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="bg-gray-900 text-white text-[11px] font-black px-1.5 py-1 rounded-md font-mono tabular-nums min-w-[22px] text-center">
            {v}
          </span>
          {i < 2 && <span className="text-gray-300 font-black text-[11px]">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function LevelBoxesPage() {
  const router = useRouter();
  const [data, setData] = useState<LevelBoxData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [viewIdx, setViewIdx] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/user/level-box");
      if (res.ok) {
        const d: LevelBoxData = await res.json();
        setData(d);
        const curIdx = d.milestones.findIndex((m) => m.isCurrent);
        setViewIdx(curIdx >= 0 ? curIdx : 0);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const milestones = data?.milestones || [];
  const viewing = milestones[viewIdx] || null;

  const goPrev = () => setViewIdx((i) => Math.max(0, i - 1));
  const goNext = () => setViewIdx((i) => Math.min(milestones.length - 1, i + 1));

  // อัตราดรอปตามความหายาก — normalize จากไอเทมที่ไม่ถูกพักเท่านั้น (ตัดล็อกออก คิด % จากยอดที่เหลือจริง)
  const dropRates = useMemo(() => {
    const items = viewing?.box.items || [];
    const unlockedTotal = items.reduce((sum, bi) => sum + (bi.isLocked ? 0 : (bi.probability || 0)), 0);
    const groups: Record<string, { prob: number; color: string; order: number }> = {};
    for (const bi of items) {
      const r = bi.itemId?.rarityId;
      if (!r || bi.isLocked) continue;
      if (!groups[r.name]) groups[r.name] = { prob: 0, color: r.color, order: r.order };
      groups[r.name].prob += unlockedTotal > 0 ? (bi.probability / unlockedTotal) * 100 : 0;
    }
    return Object.entries(groups)
      .sort((a, b) => b[1].order - a[1].order)
      .map(([name, v]) => ({ name, pct: v.prob, color: v.color }));
  }, [viewing]);

  const rewardList = useMemo(() => {
    const items = viewing?.box.items || [];
    return [...items].sort((a, b) => (b.itemId?.rarityId?.order || 0) - (a.itemId?.rarityId?.order || 0));
  }, [viewing]);

  const handleClaim = async () => {
    if (claiming || !data?.reward || data.claimedToday || !viewing?.isCurrent) return;
    setClaiming(true);
    try {
      const res = await fetch("/api/user/level-box/claim", { method: "POST" });
      const d = await res.json();
      if (!res.ok) {
        showToast(d.error || "เกิดข้อผิดพลาด", false);
        return;
      }
      showToast(`รับสิทธิ์เปิดฟรี "${d.boxName}" สำเร็จ!`, true);
      setData((prev) => (prev ? { ...prev, claimedToday: true } : prev));
    } catch {
      showToast("เกิดข้อผิดพลาด กรุณาลองใหม่", false);
    } finally {
      setClaiming(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-5 pb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-gray-400 hover:text-gray-700 text-sm font-medium mb-4 transition-colors"
        >
          <ChevronLeft size={17} /> กลับ
        </button>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0 shadow-sm">
            <Award size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-gray-900">กล่องสุ่มฟรีตามเลเวล</h1>
            <p className="text-xs text-gray-400 mt-0.5">รับสิทธิ์เปิดกล่องสุ่มฟรี 1 ครั้งทุกวัน ตามเลเวลของคุณ</p>
          </div>
          {!loading && (
            <span className="shrink-0 flex items-center gap-1 bg-gray-900 text-white text-xs font-black px-3 py-1.5 rounded-full">
              <Sparkles size={12} className="text-amber-300" /> Lv.{data?.level ?? 1}
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : milestones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400 px-4 text-center">
          <Lock size={48} className="opacity-20" />
          <p className="font-bold">แอดมินยังไม่ได้ตั้งค่ากล่องสุ่มฟรีตามเลเวล</p>
        </div>
      ) : viewing ? (
        <div className="flex flex-col gap-4 px-4 pt-4 max-w-xl mx-auto w-full">
          {/* ── Hero: Box Showcase ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-3 pt-4">
              <button
                onClick={goPrev}
                disabled={viewIdx === 0}
                className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="flex-1 flex flex-col items-center gap-3 px-1 pb-1">
                {/* status ribbon */}
                <div className="flex items-center gap-1.5 flex-wrap justify-center">
                  <span className="flex items-center gap-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                    <Award size={11} /> Lv.{viewing.minLevel}+
                  </span>
                  {viewing.isCurrent ? (
                    data?.claimedToday ? (
                      <span className="flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm">
                        <Check size={11} strokeWidth={3} /> รับวันนี้แล้ว
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-sm animate-pulse">
                        <Gift size={11} /> พร้อมรับวันนี้
                      </span>
                    )
                  ) : viewing.unlocked ? (
                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full">
                      <CheckCircle2 size={11} /> ปลดล็อกแล้ว
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-gray-100 text-gray-500 text-[10px] font-black px-2.5 py-1 rounded-full">
                      <Lock size={11} /> ยังไม่ปลดล็อก
                    </span>
                  )}
                </div>

                {/* box image with glow */}
                <div className="relative w-32 h-32">
                  {viewing.isCurrent && !data?.claimedToday && (
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/60 to-orange-200/40 blur-xl" />
                  )}
                  <div className={`relative w-full h-full rounded-2xl bg-gray-50 overflow-hidden flex items-center justify-center border border-gray-100 ${!viewing.unlocked ? "grayscale opacity-60" : ""}`}>
                    <MediaImage
                      src={viewing.box.image}
                      alt={viewing.box.name}
                      className="w-full h-full object-cover mix-blend-multiply"
                      fallbackSrc="/product/pokemon.webp"
                    />
                  </div>
                  {!viewing.unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/50 flex items-center justify-center">
                        <Lock size={18} className="text-white" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <p className="font-black text-gray-900 leading-tight">{viewing.box.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">มูลค่าเปิด ฿{viewing.box.price.toLocaleString()} / ครั้ง</p>
                </div>
              </div>

              <button
                onClick={goNext}
                disabled={viewIdx === milestones.length - 1}
                className="w-9 h-9 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors shrink-0"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* dots */}
            {milestones.length > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                {milestones.map((m, i) => (
                  <button
                    key={m.minLevel}
                    onClick={() => setViewIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === viewIdx ? "bg-red-500 w-5" : "bg-gray-200 w-1.5"}`}
                  />
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="p-4 pt-3">
              {!viewing.isCurrent ? null : data?.claimedToday ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                    รีเซ็ตสิทธิ์ในอีก <CountdownDigits resetAt={data.resetAt} />
                  </div>
                  <button
                    onClick={() => router.push(`/boxes/${viewing.box._id}`)}
                    className="w-full flex items-center justify-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold py-3 rounded-xl transition-colors"
                  >
                    ไปเปิดกล่อง <ArrowRight size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleClaim}
                  disabled={claiming}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 disabled:from-gray-300 disabled:to-gray-300 text-white text-sm font-black py-3.5 rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-[0.98]"
                >
                  <Gift size={17} /> {claiming ? "กำลังรับสิทธิ์..." : "รับสิทธิ์เปิดฟรีวันนี้"}
                </button>
              )}
            </div>
          </div>

          {/* ── Drop Rate ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-1.5">
              <Flame size={13} className="text-red-500 fill-red-500" /> อัตราดรอปตามความหายาก
            </p>
            {dropRates.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีข้อมูลอัตราดรอปสำหรับกล่องนี้</p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {dropRates.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="text-[11px] font-bold text-gray-600 w-20 shrink-0 truncate">{d.name}</span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(d.pct, 1.5)}%`, backgroundColor: d.color }} />
                    </div>
                    <span className="text-[11px] font-black text-gray-800 w-12 text-right shrink-0">{d.pct.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Reward list (horizontal scroll) ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
            <p className="text-xs font-black text-gray-700 mb-3 flex items-center gap-1.5">
              <Package size={13} className="text-gray-500" /> รายการของรางวัลในกล่อง
            </p>
            {rewardList.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-3">ยังไม่มีไอเทมในกล่องนี้</p>
            ) : (
              <div className="flex gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                {rewardList.map((bi, i) => {
                  const item = bi.itemId;
                  const rarity = item?.rarityId;
                  return (
                    <div
                      key={i}
                      className="shrink-0 w-20 rounded-xl border-2 bg-white flex flex-col items-center gap-1 p-2"
                      style={{ borderColor: rarity?.color ? `${rarity.color}50` : "#e2e8f0" }}
                    >
                      <div className="w-full aspect-square rounded-lg bg-gray-50 overflow-hidden flex items-center justify-center">
                        {item?.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                        ) : (
                          <Package size={20} className="text-gray-300" />
                        )}
                      </div>
                      <p className="text-[9px] font-bold text-gray-700 text-center line-clamp-1 w-full">{item?.name}</p>
                      {rarity && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: rarity.color }}>
                          {rarity.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-bold text-white ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
