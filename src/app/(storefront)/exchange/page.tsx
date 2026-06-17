"use client";

import { useState, useEffect } from "react";
import { Coins, Package, Box as BoxIcon, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { LoginModal } from "@/components/auth/LoginModal";

interface RarityData { name: string; color: string }
interface BoxData { _id: string; name: string; image: string; price: number }
interface ItemData { _id: string; name: string; image: string; type: string; coinRewardAmount: number; rarityId: RarityData }
interface GemReward {
  _id: string;
  name: string;
  description?: string;
  type: "box" | "item";
  boxId?: BoxData;
  boxOpenTimes?: number;
  itemId?: ItemData;
  gemCost: number;
  stock: number;
  isActive: boolean;
}

export default function ExchangePage() {
  const { data: session, update: updateSession } = useSession();
  const [rewards, setRewards] = useState<GemReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const gemCoins = (session?.user as any)?.gemCoins || 0;

  useEffect(() => {
    fetch("/api/gem-rewards")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRewards(d); })
      .finally(() => setLoading(false));
  }, []);

  const handleRedeem = async (reward: GemReward) => {
    if (!session) { setIsLoginOpen(true); return; }
    if (gemCoins < reward.gemCost) {
      setResult({ success: false, message: `GemCoin ไม่เพียงพอ (มี ${gemCoins} / ต้องการ ${reward.gemCost})` });
      return;
    }
    setRedeeming(reward._id);
    setResult(null);
    try {
      const res = await fetch(`/api/user/gem-redeem/${reward._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");
      await updateSession();
      const msg = reward.type === "box"
        ? `ได้รับสิทธิ์เปิด "${reward.boxId?.name}" ${reward.boxOpenTimes} ครั้ง!`
        : `ได้รับ "${reward.itemId?.name}" เข้า inventory แล้ว!`;
      setResult({ success: true, message: msg });
    } catch (err: any) {
      setResult({ success: false, message: err.message });
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">แลก GemCoin</h1>
            <p className="text-xs text-gray-500 font-medium">ใช้ GemCoin แลกกล่องสุ่มและไอเทมพิเศษ</p>
          </div>
          {session && (
            <div className="flex items-center gap-2 bg-purple-50 border border-purple-100 px-4 py-2 rounded-xl shadow-sm">
              <Coins size={16} className="text-purple-600" />
              <span className="font-black text-purple-700 text-lg">{gemCoins.toLocaleString()}</span>
              <span className="text-xs font-bold text-purple-400">GEM</span>
            </div>
          )}
        </div>
      </div>

      {/* Result toast */}
      {result && (
        <div className={`max-w-5xl mx-auto w-full px-4 mt-4`}>
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-sm border ${result.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {result.success ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-500 shrink-0" />}
            {result.message}
            <button onClick={() => setResult(null)} className="ml-auto text-gray-400 hover:text-gray-600 font-normal text-lg leading-none">×</button>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto w-full px-4 pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 size={28} className="animate-spin mr-2" />
            <span className="font-medium">กำลังโหลด...</span>
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <Coins size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-bold">ยังไม่มีรางวัลให้แลกในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r) => {
              const canAfford = gemCoins >= r.gemCost;
              const isOut = r.stock > 0 && r.stock === 0;
              const isLoading = redeeming === r._id;

              const img = r.type === "box"
                ? r.boxId?.image
                : (r.itemId?.type === "coin_reward" ? null : r.itemId?.image);
              const isCoinRewardItem = r.type === "item" && r.itemId?.type === "coin_reward";

              return (
                <div key={r._id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm flex flex-col transition-all ${canAfford ? "border-gray-100 hover:border-purple-200 hover:shadow-md" : "border-gray-100 opacity-70"}`}>
                  {/* Image area */}
                  <div className="relative h-44 bg-gradient-to-br from-purple-50 to-gray-50 flex items-center justify-center p-4">
                    {r.stock > 0 && (
                      <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-lg border border-amber-200">
                        เหลือ {r.stock}
                      </div>
                    )}
                    {r.stock === 0 && r.stock !== 0 && (
                      <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded-lg">หมดแล้ว</div>
                    )}
                    {isCoinRewardItem ? (
                      <span className="text-7xl drop-shadow-lg">💎</span>
                    ) : img ? (
                      <img src={img} alt={r.name} className="h-full object-contain drop-shadow-md" />
                    ) : r.type === "box" ? (
                      <BoxIcon size={56} className="text-blue-300" />
                    ) : (
                      <Package size={56} className="text-green-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-black text-gray-900 text-sm leading-tight">{r.name}</h3>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${r.type === "box" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
                        {r.type === "box" ? "🎁 กล่อง" : "📦 ไอเทม"}
                      </span>
                    </div>

                    {r.description && <p className="text-xs text-gray-500 font-medium line-clamp-2">{r.description}</p>}

                    {r.type === "box" && r.boxId && (
                      <p className="text-xs text-blue-600 font-bold">{r.boxId.name} × {r.boxOpenTimes} ครั้ง</p>
                    )}
                    {r.type === "item" && r.itemId && (
                      <div className="flex items-center gap-1.5">
                        {r.itemId.rarityId && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: `${r.itemId.rarityId.color}20`, color: r.itemId.rarityId.color }}>
                            {r.itemId.rarityId.name}
                          </span>
                        )}
                        {isCoinRewardItem && (
                          <span className="text-[10px] font-black text-purple-600">+{r.itemId.coinRewardAmount} GEM</span>
                        )}
                      </div>
                    )}

                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        <Coins size={15} className="text-purple-500" />
                        <span className="font-black text-purple-700 text-base">{r.gemCost.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-purple-400">GEM</span>
                      </div>
                      <button
                        onClick={() => handleRedeem(r)}
                        disabled={isLoading || !canAfford}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                          isLoading ? "bg-gray-100 text-gray-400 cursor-wait"
                          : !canAfford ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm active:scale-95"
                        }`}
                      >
                        {isLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                        {isLoading ? "กำลังแลก..." : canAfford ? "แลกเลย" : "GEM ไม่พอ"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!session && (
          <div className="text-center mt-8 p-6 bg-purple-50 rounded-2xl border border-purple-100">
            <Coins size={32} className="mx-auto mb-2 text-purple-400" />
            <p className="font-bold text-purple-800 mb-3">เข้าสู่ระบบเพื่อแลก GemCoin</p>
            <button onClick={() => setIsLoginOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              เข้าสู่ระบบ
            </button>
          </div>
        )}
      </div>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
