"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Users, Ticket, Gift, Package, Sparkles, X, HelpCircle, Share } from "lucide-react";

interface RoundData {
  _id: string;
  label: string;
  image?: string;
  rewardType: "cash" | "item";
  totalAmount?: number;
  item?: { name: string; image: string } | null;
  conditionAmount: number;
  conditionLevel: number;
  maxPeople: number;
  currentPeople: number;
  scheduledAt: string;
  endsAt: string;
  status: "scheduled" | "open" | "resolved" | "cancelled";
  joined: boolean;
  myResult: { rewardAmount?: number; isWinner?: boolean } | null;
}

interface RecentEntry {
  userId: string;
  name: string;
  avatar?: string;
  vipLevel?: number;
  tagImage?: string;
  time: string;
  rewardType: "cash" | "item";
  pending?: boolean;
  rewardAmount?: number;
  isWinner?: boolean;
  itemName?: string;
}

interface JoinResult {
  roundId?: string;
  rewardType: "cash" | "item";
  pending?: boolean;
  rewardAmount?: number;
  isWinner?: boolean;
  itemName?: string;
  itemImage?: string;
}

function timeFmt(iso: string) {
  return new Date(iso).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

export default function RedEnvelopePage() {
  const { data: session, update: updateSession } = useSession();
  const [rounds, setRounds] = useState<RoundData[]>([]);
  const [todaySpend, setTodaySpend] = useState(0);
  const [myLevel, setMyLevel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null);
  const [claiming, setClaiming] = useState(false);

  const [activeTab, setActiveTab] = useState<"today" | "yesterday">("today");
  const [participants, setParticipants] = useState<RecentEntry[]>([]);
  const [participantsTotal, setParticipantsTotal] = useState(0);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  const [showHelp, setShowHelp] = useState(false);
  const [helpText, setHelpText] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setHelpText(d.red_envelope_help_text || ""))
      .catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "ชิงรางวัลฟรี - ซองแดง", url });
      } catch {}
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast("คัดลอกลิงก์แล้ว");
    } catch {
      showToast("ไม่สามารถคัดลอกลิงก์ได้");
    }
  };

  // เลือกรอบ open ก่อน ถ้าไม่มีค่อยไปรอบ scheduled ถ้าไม่มีอีกค่อย fallback รอบแรก
  const pickDefaultIdx = (list: RoundData[]) => {
    const openIdx = list.findIndex((r) => r.status === "open");
    if (openIdx >= 0) return openIdx;
    const scheduledIdx = list.findIndex((r) => r.status === "scheduled");
    return scheduledIdx >= 0 ? scheduledIdx : 0;
  };

  const fetchRounds = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/red-envelope/rounds");
      if (res.ok) {
        const data = await res.json();
        const newRounds: RoundData[] = data.rounds || [];
        setActiveIdx((prevIdx) => {
          const prevRoundId = rounds[prevIdx]?._id;
          // ถ้ารอบที่เลือกไว้เดิมยังอยู่ในลิสต์ใหม่ (ยังไม่จบ) ให้คงที่เดิมไว้ ไม่กระโดดหนีจากที่ผู้ใช้เลือกเอง
          // ถ้าหายไปแล้ว (จับรางวัลจบไปแล้ว) ให้ไปที่รอบ "ยังไม่เริ่ม" ก่อนเป็นอันดับแรก
          const stillThere = prevRoundId ? newRounds.findIndex((r) => r._id === prevRoundId) : -1;
          return stillThere >= 0 ? stillThere : pickDefaultIdx(newRounds);
        });
        setRounds(newRounds);
        setTodaySpend(data.todaySpend || 0);
        setMyLevel(data.myLevel || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [rounds]);

  useEffect(() => { fetchRounds(); }, []);

  const activeRoundId = rounds[activeIdx]?._id;

  useEffect(() => {
    if (activeTab === "today" && !activeRoundId) return;
    setParticipants([]);
    setParticipantsTotal(0);
    setParticipantsLoading(true);
    const url = activeTab === "today"
      ? `/api/red-envelope/recent?day=today&roundId=${activeRoundId}&t=${Date.now()}`
      : `/api/red-envelope/recent?day=yesterday&matchScheduledAt=${encodeURIComponent(round?.scheduledAt || "")}&t=${Date.now()}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => { setParticipants(d.entries || []); setParticipantsTotal(d.total || 0); })
      .catch(() => {})
      .finally(() => setParticipantsLoading(false));
  }, [activeTab, activeRoundId]);

  useEffect(() => {
    if (activeIdx >= rounds.length) setActiveIdx(0);
  }, [rounds.length, activeIdx]);

  const round = rounds[activeIdx];

  const handleClaim = async (roundId: string) => {
    if (claiming) return;
    setClaiming(true);
    try {
      const res = await fetch(`/api/red-envelope/rounds/${roundId}/claim`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || "เกิดข้อผิดพลาด"); return; }
      window.dispatchEvent(new CustomEvent("open-livechat", { detail: { conversationId: data.conversationId } }));
      setJoinResult(null);
    } finally {
      setClaiming(false);
    }
  };

  const handleJoin = async () => {
    if (!round || joining) return;
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch(`/api/red-envelope/rounds/${round._id}/join`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) { setJoinError(data.error || "เกิดข้อผิดพลาด"); return; }
      // ปกติจะ pending เสมอ — รอครบคน/หมดเวลาแล้วค่อยรู้ผล ยกเว้นเป็นคนที่กดแล้วครบพอดี จะได้ผลกลับมาทันที
      setJoinResult({ ...data, roundId: round._id });
      await updateSession();
      await fetchRounds();
    } catch {
      setJoinError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-10 relative overflow-x-hidden">
      {/* Top Red Background (Extends behind slider) */}
      <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-[#ff1a1a] via-[#ff4d4d] to-gray-50 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      </div>
      
      {/* Header Content */}
      <div className="w-full pt-4 pb-6 px-4 lg:px-6 relative z-10">
        <div className="flex items-center justify-between mb-6 max-w-7xl mx-auto">
          <Link href="/" className="w-10 h-10 flex items-center justify-center -ml-2">
            <ChevronLeft size={28} className="text-white" />
          </Link>
          <h1 className="text-xl font-bold text-white tracking-tight">
            ชิงรางวัลฟรี
          </h1>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowHelp(true)} className="w-10 h-10 flex items-center justify-center">
              <HelpCircle size={24} className="text-white" />
            </button>
            <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center -mr-2">
              <Share size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Time Slots */}
        <div className="max-w-7xl mx-auto flex justify-center">
          <div className="flex gap-2.5 overflow-x-auto hide-scrollbar snap-x px-1">
            {rounds.map((r, idx) => {
              const active = activeIdx === idx;
              return (
                <button
                  key={r._id}
                  onClick={() => setActiveIdx(idx)}
                  className={`shrink-0 w-[105px] py-2.5 rounded-lg text-center snap-center transition-all ${
                    active ? "bg-white shadow-md" : "bg-white/30 hover:bg-white/40"
                  }`}
                >
                  <div className={`text-[15px] font-medium ${active ? "text-red-500" : "text-white"}`}>
                    {timeFmt(r.scheduledAt)}
                  </div>
                  <div className={`text-[12px] font-medium mt-0.5 ${active ? "text-black font-bold" : "text-white/80"}`}>
                    {r.status === "scheduled" ? "ยังไม่เริ่ม" : r.status === "open" ? "เปิดอยู่" : r.status === "resolved" ? "จบแล้ว" : "ยกเลิก"}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 lg:p-6 max-w-7xl mx-auto flex flex-col gap-5 relative z-20 mt-2">

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl shadow-sm">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : rounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400 bg-white rounded-2xl shadow-sm">
          <Gift size={56} className="opacity-20" />
          <p className="font-bold">วันนี้ยังไม่มีรอบซองแดง</p>
          <p className="text-sm">รอติดตามรอบถัดไปได้เลย</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 items-center w-full max-w-[460px] lg:max-w-4xl mx-auto">

          {/* Top: Main Content */}
          <div className="w-full flex flex-col gap-4">

            {/* Envelope Selector Dots */}
            {rounds.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {rounds.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveIdx(idx)}
                    className={`rounded-full transition-all ${activeIdx === idx ? "w-6 h-2.5 bg-red-600" : "w-2.5 h-2.5 bg-gray-300 hover:bg-gray-400"}`}
                  />
                ))}
              </div>
            )}

            {/* Envelope Carousel */}
            <div className="relative w-full h-[540px] flex items-center justify-center py-4 overflow-visible lg:rounded-3xl">
              {rounds.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveIdx((prev) => (prev - 1 + rounds.length) % rounds.length)}
                    className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/20 transition z-30 shadow-lg border border-white/20"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    onClick={() => setActiveIdx((prev) => (prev + 1) % rounds.length)}
                    className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-black/20 transition z-30 shadow-lg border border-white/20"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              )}

              {rounds.map((r, idx) => {
                let position = "hidden";
                let transformStyle = {};
                let opacity = 0;
                let pointerEvents: "auto" | "none" = "none";

                if (idx === activeIdx) {
                  position = "center";
                  transformStyle = { transform: "translateX(0) scale(1)", zIndex: 20 };
                  opacity = 1;
                  pointerEvents = "auto";
                } else if (idx === (activeIdx - 1 + rounds.length) % rounds.length) {
                  position = "left";
                  transformStyle = { transform: "translateX(-85%) scale(0.85) rotateY(15deg)", zIndex: 10 };
                  opacity = 0.5;
                } else if (idx === (activeIdx + 1) % rounds.length) {
                  position = "right";
                  transformStyle = { transform: "translateX(85%) scale(0.85) rotateY(-15deg)", zIndex: 10 };
                  opacity = 0.5;
                }

                if (position === "hidden") return null;

                const rProgress = r.maxPeople > 0 ? Math.min(100, (r.currentPeople / r.maxPeople) * 100) : 0;
                const rEligibleSpend = todaySpend >= r.conditionAmount;
                const rEligibleLevel = myLevel >= r.conditionLevel;

                return (
                  <div
                    key={r._id}
                    className="absolute w-[85%] max-w-[340px] transition-all duration-500 ease-out"
                    style={{ ...transformStyle, opacity, pointerEvents, perspective: "1000px" }}
                  >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-full flex flex-col items-center min-h-[480px]">
                      {/* Badge */}
                      <div className={`font-bold px-4 py-1.5 rounded-full text-sm mb-5 flex items-center gap-1.5 border ${
                        r.rewardType === "cash" ? "bg-red-50 border-red-100 text-red-600" : "bg-purple-50 border-purple-100 text-purple-600"
                      }`}>
                        {r.rewardType === "cash" ? "🧧" : "🎁"} {r.label}
                      </div>

                      {/* Visual */}
                      {r.image ? (
                        <div className="w-28 h-28 mb-4 rounded-2xl overflow-hidden shadow-lg bg-gray-100">
                          <img src={r.image} alt={r.label} className="w-full h-full object-cover" />
                        </div>
                      ) : r.rewardType === "cash" ? (
                        <div className="w-24 h-24 mb-4">
                          <div className="w-full h-full bg-gradient-to-b from-red-500 to-red-700 rounded-2xl shadow-[0_8px_20px_rgba(220,38,38,0.35)] flex items-center justify-center relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/10" style={{ transform: "skewX(-20deg) translateX(-50%)" }} />
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 border-4 border-yellow-200 shadow-inner flex items-center justify-center relative z-10">
                              <div className="w-6 h-6 rounded-full bg-yellow-200/70" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-28 h-28 mb-4 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 p-1 shadow-lg">
                          <div className="w-full h-full rounded-[14px] overflow-hidden bg-gray-100">
                            {r.item?.image ? (
                              <img src={r.item.image} alt={r.item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package size={36} className="text-gray-300" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Reward display */}
                      {r.rewardType === "cash" ? (
                        <div className="text-red-600 font-black text-4xl tracking-tight mb-5">
                          ฿{(r.totalAmount || 0).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                        </div>
                      ) : (
                        <div className="text-center mb-5">
                          <div className="font-black text-xl text-purple-600 line-clamp-1">{r.item?.name}</div>
                          <div className="text-xs text-gray-400 mt-1">สุ่มผู้โชคดี 1 คนจากผู้เข้าร่วม</div>
                        </div>
                      )}

                      {/* Conditions */}
                      <div className="w-full bg-gray-50 rounded-xl p-4 mb-4 border border-gray-100 space-y-3 mt-auto">
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Ticket size={14} className="text-gray-400" />
                            <span>เงื่อนไข:</span>
                          </div>
                          <span>
                            ยอดใช้จ่าย <span className={`font-bold ${rEligibleSpend ? "text-emerald-600" : "text-red-500"}`}>
                              {todaySpend.toLocaleString()}/{r.conditionAmount.toLocaleString()}
                            </span>
                          </span>
                        </div>
                        {r.conditionLevel > 0 && (
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Ticket size={14} className="text-gray-400" />
                              <span>เลเวลขั้นต่ำ: Lv.{r.conditionLevel} ขึ้นไป</span>
                            </div>
                            <span className={`font-bold ${rEligibleLevel ? "text-emerald-600" : "text-red-500"}`}>
                              คุณ Lv.{myLevel}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-2">
                              <Users size={14} className="text-gray-400" />
                              <span>ครบ <span className="text-red-500 font-bold">{r.maxPeople}</span> คนออกรางวัล</span>
                            </div>
                            <span className="font-semibold text-gray-700">{r.currentPeople}/{r.maxPeople}</span>
                          </div>
                          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-red-500 to-red-600"
                              style={{ width: `${rProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {joinError && position === "center" && (
                        <div className="w-full bg-red-50 border border-red-100 text-red-600 text-xs font-bold px-4 py-2.5 rounded-xl mb-3 text-center">
                          {joinError}
                        </div>
                      )}

                      {/* Action Button */}
                      {!session ? (
                        <Link href="/profile" className="w-full py-3.5 rounded-xl font-bold text-white text-base bg-gradient-to-b from-red-500 to-red-600 shadow-[0_3px_0_#b91c1c] text-center block">
                          เข้าสู่ระบบ
                        </Link>
                      ) : r.status === "resolved" ? (
                        r.myResult ? (
                          r.rewardType === "cash" ? (
                            <div className={`w-full py-3.5 rounded-xl font-bold text-base text-center ${(r.myResult.rewardAmount || 0) > 0 ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-500"}`}>
                              {(r.myResult.rewardAmount || 0) > 0 ? `🎉 ได้รับ ฿${(r.myResult.rewardAmount || 0).toLocaleString()}` : "ไม่ได้รับรางวัลครั้งนี้"}
                            </div>
                          ) : (
                            <div className={`w-full py-3.5 rounded-xl font-bold text-base text-center ${r.myResult.isWinner ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-100 text-gray-500"}`}>
                              {r.myResult.isWinner ? "🎁 คุณได้รับของรางวัล!" : "ไม่ได้รับรางวัลครั้งนี้"}
                            </div>
                          )
                        ) : (
                          <div className="w-full py-3.5 rounded-xl font-bold text-gray-400 text-sm bg-gray-100 text-center">
                            ปิดรับแล้ว
                          </div>
                        )
                      ) : r.joined ? (
                        <div className="w-full py-3.5 rounded-xl font-bold text-gray-500 text-sm bg-gray-100 text-center">
                          เข้าร่วมแล้ว · รอครบคน/หมดเวลาเพื่อจับรางวัล
                        </div>
                      ) : r.status === "scheduled" ? (
                        <button disabled className="w-full py-3.5 rounded-xl font-bold text-white text-base bg-gradient-to-b from-gray-400 to-gray-500 shadow-[0_3px_0_#9ca3af] cursor-not-allowed">
                          {timeFmt(r.scheduledAt)} เริ่ม
                        </button>
                      ) : r.currentPeople >= r.maxPeople ? (
                        <button disabled className="w-full py-3.5 rounded-xl font-bold text-white text-base bg-gradient-to-b from-gray-400 to-gray-500 shadow-[0_3px_0_#9ca3af] cursor-not-allowed">
                          เต็มแล้ว
                        </button>
                      ) : !rEligibleLevel ? (
                        <button disabled className="w-full py-3.5 rounded-xl font-bold text-white text-base bg-gradient-to-b from-gray-400 to-gray-500 shadow-[0_3px_0_#9ca3af] cursor-not-allowed text-[14px]">
                          เลเวลขั้นต่ำ Lv.{r.conditionLevel}
                        </button>
                      ) : !rEligibleSpend ? (
                        <button disabled className="w-full py-3.5 rounded-xl font-bold text-white text-base bg-gradient-to-b from-gray-400 to-gray-500 shadow-[0_3px_0_#9ca3af] cursor-not-allowed text-[14px]">
                          ใช้จ่ายเพิ่ม ฿{(r.conditionAmount - todaySpend).toLocaleString()}
                        </button>
                      ) : (
                        <button
                          onClick={handleJoin}
                          disabled={joining}
                          className="w-full py-3.5 rounded-xl font-bold text-white text-base bg-gradient-to-b from-red-500 to-red-600 shadow-[0_3px_0_#b91c1c] hover:from-red-600 hover:to-red-700 active:shadow-none active:translate-y-0.5 transition-all disabled:opacity-60"
                        >
                          {joining ? "กำลังเข้าร่วม..." : "🧧 ร่วมรับรางวัล"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom: Participants */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden w-full relative z-30">
            <div className="flex border-b border-gray-100 px-4">
              {[
                { key: "today" as const, label: `ผู้เข้าร่วมวันนี้${activeTab === "today" ? ` (${participantsTotal})` : ""}` },
                { key: "yesterday" as const, label: `ผู้เข้าร่วมเมื่อวานนี้${activeTab === "yesterday" ? ` (${participantsTotal})` : ""}` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 mr-6 text-sm font-bold relative transition-colors whitespace-nowrap ${
                    activeTab === tab.key ? "text-gray-900" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-600 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 flex flex-col gap-2 max-h-[600px] overflow-y-auto">
              {participantsLoading ? (
                <div className="flex justify-center py-10">
                  <div className="w-6 h-6 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                </div>
              ) : participants.length === 0 ? (
                <p className="text-center text-gray-400 py-10 font-medium text-sm">ยังไม่มีคนได้รับรางวัล{activeTab === "today" ? "วันนี้" : "เมื่อวาน"}</p>
              ) : (
                participants.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-3"
                  >
                    <span className="w-8 text-center text-gray-500 font-bold text-sm shrink-0">{i + 1}</span>
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0 bg-gray-200">
                      <img src={p.avatar || `https://api.dicebear.com/9.x/avataaars/svg?seed=${p.name}`} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-gray-800 truncate max-w-[120px]">{p.name}</span>
                        {p.tagImage ? (
                          <img src={p.tagImage} alt={`VIP ${p.vipLevel}`} className="h-4 object-contain" />
                        ) : !!p.vipLevel ? (
                          <span className="shrink-0 bg-gradient-to-r from-blue-500 to-cyan-400 text-white text-[9px] font-black px-1.5 py-0.5 rounded italic">
                            V{p.vipLevel}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{timeFmt(p.time)}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base">{p.pending ? "⏳" : p.rewardType === "item" ? (p.isWinner ? "🎁" : "🙁") : "🧧"}</span>
                      <span className={`font-black text-sm min-w-[70px] text-right ${
                        p.pending ? "text-gray-400" : p.rewardType === "item" ? (p.isWinner ? "text-purple-600" : "text-gray-400") : "text-red-600"
                      }`}>
                        {p.pending ? "รอผล" : p.rewardType === "cash" ? `฿${(p.rewardAmount || 0).toFixed(2)}` : p.isWinner ? p.itemName : "ไม่ได้รางวัล"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Reveal Modal */}
      {joinResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setJoinResult(null)}>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 text-center relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setJoinResult(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <div className="w-20 h-20 bg-gradient-to-b from-amber-300 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <Sparkles size={36} className="text-white" />
            </div>

            {joinResult.pending ? (
              <div>
                <p className="font-black text-gray-900 text-xl">เข้าร่วมสำเร็จ! 🧧</p>
                <p className="text-gray-500 text-sm mt-1">รอจนกว่าจะครบคนหรือหมดเวลา ระบบจะสุ่มผลให้ทุกคนพร้อมกันทีเดียว</p>
              </div>
            ) : joinResult.rewardType === "cash" ? (
              <>
                <div>
                  <p className="font-black text-gray-900 text-xl">ยินดีด้วย! 🧧</p>
                  <p className="text-gray-500 text-sm mt-1">คุณได้รับ</p>
                </div>
                <p className="font-black text-red-600 text-3xl">฿{(joinResult.rewardAmount || 0).toLocaleString()}</p>
              </>
            ) : joinResult.isWinner ? (
              <>
                <div>
                  <p className="font-black text-gray-900 text-xl">ยินดีด้วย! 🎉</p>
                  <p className="text-gray-500 text-sm mt-1">คุณคือผู้โชคดีได้รับ</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  {joinResult.itemImage && <img src={joinResult.itemImage} alt="" className="w-20 h-20 object-contain" />}
                  <p className="font-black text-purple-600 text-lg">{joinResult.itemName}</p>
                </div>
              </>
            ) : (
              <div>
                <p className="font-black text-gray-900 text-xl">เสียใจด้วย 😢</p>
                <p className="text-gray-500 text-sm mt-1">รอบนี้คุณไม่ได้รับ "{joinResult.itemName}" ลองรอบหน้าใหม่นะ</p>
              </div>
            )}

            {joinResult.rewardType === "item" && joinResult.isWinner && joinResult.roundId ? (
              <button
                onClick={() => handleClaim(joinResult.roundId!)}
                disabled={claiming}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 disabled:opacity-60 transition-colors text-sm"
              >
                {claiming ? "กำลังเปิดแชท..." : "แชทกับทีมงานเพื่อรับไอเทม"}
              </button>
            ) : (
              <button onClick={() => setJoinResult(null)} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm">
                รับทราบ
              </button>
            )}
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 flex flex-col gap-4 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <HelpCircle size={20} className="text-red-500" /> วิธีเล่นซองแดง
            </h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
              {helpText || "เข้าร่วมซองแดงเพื่อลุ้นรับเงินหรือไอเทมสุ่ม"}
            </p>
            <button onClick={() => setShowHelp(false)} className="w-full bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 transition-colors text-sm">
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white bg-gray-800 whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}
