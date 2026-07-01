"use client";

import { useState, useEffect } from "react";
import { Coins, Package, Box as BoxIcon, CheckCircle2, AlertCircle, Loader2, ShoppingBag, Copy, Check, X, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/auth/LoginModal";

interface RarityData { name: string; color: string }
interface BoxData { _id: string; name: string; image: string; price: number }
interface ItemData { _id: string; name: string; image: string; type: string; coinRewardAmount: number; rarityId: RarityData }
interface ShopData { _id: string; title: string; images: string[]; price: number }
interface GemReward {
  _id: string;
  name: string;
  description?: string;
  type: "box" | "item" | "shop";
  boxId?: BoxData;
  boxOpenTimes?: number;
  itemId?: ItemData;
  shopListingId?: ShopData;
  shopStock?: number;
  gemCost: number;
  stock: number;
  isActive: boolean;
}

interface RedeemModal {
  type: "box" | "item";
  name: string;
  image?: string;
  boxId?: string;
  detail: string;
  isCoinReward?: boolean;
  gemAmount?: number;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-purple-100 transition-colors">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-purple-400" />}
    </button>
  );
}

export default function ExchangePage() {
  const { data: session, update: updateSession } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<GemReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);
  const [accountModal, setAccountModal] = useState<{ name: string; data: string } | null>(null);
  const [redeemModal, setRedeemModal] = useState<RedeemModal | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const gemCoins = (session?.user as any)?.gemCoins || 0;
  const [gemcoinIcon, setGemcoinIcon] = useState("");

  useEffect(() => {
    fetch("/api/gem-rewards")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRewards(d); })
      .finally(() => setLoading(false));
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setGemcoinIcon(d.gemcoin_icon || ""))
      .catch(() => {});
  }, []);

  const showToast = (success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRedeem = async (reward: GemReward) => {
    if (!session) { setIsLoginOpen(true); return; }
    if (gemCoins < reward.gemCost) {
      showToast(false, `GemCoin ไม่เพียงพอ (มี ${gemCoins} / ต้องการ ${reward.gemCost})`);
      return;
    }
    setRedeeming(reward._id);
    try {
      const res = await fetch(`/api/user/gem-redeem/${reward._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

      await updateSession();

      if (data.rewardDetail?.type === "shop" && data.rewardDetail?.accountData) {
        setAccountModal({ name: reward.name, data: data.rewardDetail.accountData });
      } else if (reward.type === "box") {
        setRedeemModal({
          type: "box",
          name: reward.name,
          image: reward.boxId?.image,
          boxId: reward.boxId?._id,
          detail: `ได้รับสิทธิ์เปิด "${reward.boxId?.name}" ${reward.boxOpenTimes} ครั้ง`,
        });
      } else {
        const isCoinReward = reward.itemId?.type === "coin_reward";
        setRedeemModal({
          type: "item",
          name: reward.name,
          image: isCoinReward ? undefined : reward.itemId?.image,
          detail: isCoinReward
            ? `ได้รับ ${reward.itemId?.coinRewardAmount} GemCoin`
            : `ได้รับ "${reward.itemId?.name}" เข้า Inventory แล้ว`,
          isCoinReward,
          gemAmount: reward.itemId?.coinRewardAmount,
        });
      }

      // รีโหลด rewards เพื่ออัปเดต stock
      fetch("/api/gem-rewards").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setRewards(d); });
    } catch (err: any) {
      showToast(false, err.message);
    } finally {
      setRedeeming(null);
    }
  };

  const getEffectiveStock = (r: GemReward) => {
    if (r.type === "shop") return r.shopStock ?? 0;
    return r.stock; // 0 = unlimited for box/item
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">แลก GemCoin</h1>
            <p className="text-xs text-gray-500 font-medium">ใช้ GemCoin แลกกล่องสุ่ม ไอเทม และสินค้าพิเศษ</p>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="max-w-5xl mx-auto w-full px-4 mt-4">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm shadow-sm border ${toast.success ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
            {toast.success ? <CheckCircle2 size={18} className="text-green-600 shrink-0" /> : <AlertCircle size={18} className="text-red-500 shrink-0" />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-auto text-gray-400 hover:text-gray-600 font-normal text-lg leading-none">×</button>
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
            {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-12 h-12 mx-auto mb-3 opacity-30 object-contain" /> : <Coins size={48} className="mx-auto mb-3 opacity-30" />}
            <p className="font-bold">ยังไม่มีรางวัลให้แลกในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r) => {
              const effectiveStock = getEffectiveStock(r);
              const isOutOfStock = r.type === "shop" ? effectiveStock === 0 : (r.stock > 0 && effectiveStock === 0);
              const canAfford = !isOutOfStock && gemCoins >= r.gemCost;
              const isLoading = redeeming === r._id;

              const img = r.type === "box" ? r.boxId?.image
                : r.type === "shop" ? r.shopListingId?.images?.[0]
                : (r.itemId?.type === "coin_reward" ? null : r.itemId?.image);
              const isCoinRewardItem = r.type === "item" && r.itemId?.type === "coin_reward";

              const typeBadge = r.type === "box" ? { label: "🎁 กล่องสุ่ม", cls: "bg-blue-100 text-blue-700" }
                : r.type === "shop" ? { label: "🛍️ ร้านค้า", cls: "bg-orange-100 text-orange-700" }
                : { label: "📦 ไอเทม", cls: "bg-green-100 text-green-700" };

              return (
                <div key={r._id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm flex flex-col transition-all ${isOutOfStock ? "border-gray-100 opacity-60" : canAfford ? "border-gray-100 hover:border-purple-200 hover:shadow-md" : "border-gray-100 opacity-80"}`}>
                  {/* Image */}
                  <div className="relative h-44 bg-gradient-to-br from-purple-50 to-gray-50 flex items-center justify-center p-4">
                    <span className={`absolute top-3 left-3 text-[9px] font-black px-2 py-1 rounded-lg ${typeBadge.cls}`}>{typeBadge.label}</span>
                    {r.type === "shop" && (
                      <div className={`absolute top-3 right-3 text-[10px] font-black px-2 py-1 rounded-lg border ${effectiveStock === 0 ? "bg-red-100 text-red-600 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                        {effectiveStock === 0 ? "หมดแล้ว" : `เหลือ ${effectiveStock}`}
                      </div>
                    )}
                    {r.type !== "shop" && r.stock > 0 && (
                      <div className="absolute top-3 right-3 bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-1 rounded-lg border border-amber-200">
                        เหลือ {r.stock}
                      </div>
                    )}
                    {isCoinRewardItem ? (
                      <span className="text-7xl drop-shadow-lg">💎</span>
                    ) : img ? (
                      <img src={img} alt={r.name} className="h-full object-contain drop-shadow-md" />
                    ) : r.type === "box" ? (
                      <BoxIcon size={56} className="text-blue-300" />
                    ) : r.type === "shop" ? (
                      <ShoppingBag size={56} className="text-orange-300" />
                    ) : (
                      <Package size={56} className="text-green-300" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4 flex flex-col gap-2 flex-1">
                    <h3 className="font-black text-gray-900 text-sm leading-tight">{r.name}</h3>
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
                        {isCoinRewardItem && <span className="text-[10px] font-black text-purple-600">+{r.itemId.coinRewardAmount} GEM</span>}
                      </div>
                    )}
                    {r.type === "shop" && r.shopListingId && (
                      <p className="text-xs text-orange-600 font-bold">{r.shopListingId.title}</p>
                    )}

                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-[15px] h-[15px] object-contain" /> : <Coins size={15} className="text-purple-500" />}
                        <span className="font-black text-purple-700 text-base">{r.gemCost.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-purple-400">GEM</span>
                      </div>
                      <button
                        onClick={() => handleRedeem(r)}
                        disabled={isLoading || !canAfford}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                          isLoading ? "bg-gray-100 text-gray-400 cursor-wait"
                          : isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : !canAfford ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-purple-600 hover:bg-purple-700 text-white shadow-sm active:scale-95"
                        }`}
                      >
                        {isLoading && <Loader2 size={13} className="animate-spin" />}
                        {isLoading ? "กำลังแลก..." : isOutOfStock ? "หมดแล้ว" : canAfford ? "แลกเลย" : "GEM ไม่พอ"}
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
            {gemcoinIcon ? <img src={gemcoinIcon} alt="" className="w-8 h-8 mx-auto mb-2 object-contain" /> : <Coins size={32} className="mx-auto mb-2 text-purple-400" />}
            <p className="font-bold text-purple-800 mb-3">เข้าสู่ระบบเพื่อแลก GemCoin</p>
            <button onClick={() => setIsLoginOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              เข้าสู่ระบบ
            </button>
          </div>
        )}
      </div>

      {/* Account Data Modal */}
      {accountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={20} />
                <span className="font-black text-lg">แลกสำเร็จ!</span>
              </div>
              <p className="text-purple-100 text-sm font-medium">{accountModal.name}</p>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2">ข้อมูลสินค้าของคุณ</p>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-3">
                  <pre className="text-sm font-mono text-slate-800 whitespace-pre-wrap break-all flex-1 leading-relaxed">{accountModal.data}</pre>
                  <CopyButton text={accountModal.data} />
                </div>
              </div>
              <p className="text-xs text-slate-400 font-medium text-center">โปรดบันทึกข้อมูลนี้ไว้ก่อนปิดหน้าต่าง</p>
              <button onClick={() => setAccountModal(null)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black py-3 rounded-xl text-sm transition-colors">
                รับทราบแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />

      {/* Redeem Result Modal (box / item) */}
      {redeemModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setRedeemModal(null)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header gradient */}
            <div className={`px-6 py-5 flex flex-col items-center gap-1 ${redeemModal.type === "box" ? "bg-gradient-to-br from-blue-500 to-purple-600" : "bg-gradient-to-br from-purple-500 to-pink-500"}`}>
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-1">
                <Sparkles size={32} className="text-white" />
              </div>
              <p className="text-white font-black text-xl">แลกสำเร็จ! 🎉</p>
              <p className="text-white/80 text-sm font-medium text-center">{redeemModal.name}</p>
            </div>

            <div className="p-6 flex flex-col items-center gap-4">
              {/* Image */}
              {redeemModal.isCoinReward ? (
                <span className="text-7xl drop-shadow-lg">💎</span>
              ) : redeemModal.image ? (
                <div className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-100 shadow-md">
                  <img src={redeemModal.image} alt="" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center">
                  {redeemModal.type === "box" ? <BoxIcon size={36} className="text-blue-400" /> : <Package size={36} className="text-purple-400" />}
                </div>
              )}

              <p className="text-center font-bold text-gray-700 text-sm leading-relaxed">{redeemModal.detail}</p>

              <div className="w-full flex flex-col gap-2">
                {redeemModal.type === "box" && redeemModal.boxId ? (
                  <button
                    onClick={() => { setRedeemModal(null); router.push(`/boxes/${redeemModal.boxId}`); }}
                    className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-b from-blue-500 to-blue-600 shadow-[0_3px_0_#1d4ed8] hover:from-blue-600 hover:to-blue-700 active:shadow-none active:translate-y-0.5 transition-all text-sm"
                  >
                    ไปเปิดกล่องเลย 🎁
                  </button>
                ) : (
                  <button
                    onClick={() => { setRedeemModal(null); router.push("/profile"); }}
                    className="w-full py-3 rounded-xl font-black text-white bg-gradient-to-b from-purple-500 to-purple-600 shadow-[0_3px_0_#6b21a8] hover:from-purple-600 hover:to-purple-700 active:shadow-none active:translate-y-0.5 transition-all text-sm"
                  >
                    ดู Inventory ของฉัน 📦
                  </button>
                )}
                <button
                  onClick={() => setRedeemModal(null)}
                  className="w-full py-2.5 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors text-sm"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
