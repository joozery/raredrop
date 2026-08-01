"use client";

import { useState, useEffect, useCallback } from "react";
import { Package, Box as BoxIcon, CheckCircle2, AlertCircle, Loader2, ShoppingBag, Copy, Check } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { LoginModal } from "@/components/auth/LoginModal";

interface RarityData { name: string; color: string }
interface BoxData { _id: string; name: string; image: string; price: number }
interface ItemData { _id: string; name: string; image: string; type: string; coinRewardAmount: number; rarityId: RarityData }
interface ShopData { _id: string; title: string; images: string[]; price: number }
interface HoneycombReward {
  _id: string;
  name: string;
  description?: string;
  type: "box" | "item" | "shop";
  boxId?: BoxData;
  boxOpenTimes?: number;
  itemId?: ItemData;
  shopListingId?: ShopData;
  shopStock?: number;
  honeyCost: number;
  stock: number;
  isActive: boolean;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} className="ml-2 p-1 rounded hover:bg-amber-100 transition-colors">
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} className="text-amber-400" />}
    </button>
  );
}

export default function HoneycombExchangePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [rewards, setRewards] = useState<HoneycombReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [toast, setToast] = useState<{ success: boolean; message: string } | null>(null);
  const [accountModal, setAccountModal] = useState<{ name: string; data: string } | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [coinIcon, setCoinIcon] = useState("");
  const [coinName, setCoinName] = useState("เหรียญรังผึ้ง");
  const [honeyCoins, setHoneyCoins] = useState(0);

  const fetchBalance = useCallback(async () => {
    if (!session) return;
    try {
      const res = await fetch("/api/user/balance");
      const data = await res.json();
      if (!data.error) setHoneyCoins(data.honeyCoins ?? 0);
    } catch {}
  }, [session]);

  useEffect(() => {
    fetch("/api/honeycomb-rewards")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setRewards(d); })
      .finally(() => setLoading(false));
    fetch("/api/public-settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setCoinIcon(d.honeycomb_coin_icon || "");
        setCoinName(d.honeycomb_coin_name || "เหรียญรังผึ้ง");
      })
      .catch(() => {});
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const showToast = (success: boolean, message: string) => {
    setToast({ success, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRedeem = async (reward: HoneycombReward) => {
    if (!session) { setIsLoginOpen(true); return; }
    if (honeyCoins < reward.honeyCost) {
      showToast(false, `${coinName}ไม่เพียงพอ (มี ${honeyCoins} / ต้องการ ${reward.honeyCost})`);
      return;
    }
    setRedeeming(reward._id);
    try {
      const res = await fetch(`/api/user/honeycomb-redeem/${reward._id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด");

      setHoneyCoins(data.honeyCoinsLeft ?? 0);

      if (reward.type === "box") {
        if (reward.boxId?._id) router.push(`/boxes/${reward.boxId._id}`);
        else showToast(true, `ได้รับสิทธิ์เปิดกล่อง "${reward.boxId?.name}" แล้ว!`);
      } else {
        let chatText = `แลก${coinName}สำเร็จ ได้รับ "${reward.itemId?.name}" เข้า Inventory แล้วครับ`;
        let chatImage: string | undefined = reward.itemId?.image;
        if (reward.type === "shop") {
          chatText = `แลก${coinName}สำเร็จ ได้รับสินค้า "${reward.name}" ข้อมูลสินค้า:\n${data.rewardDetail?.accountData || ""}`;
          chatImage = reward.shopListingId?.images?.[0];
        }
        try {
          const chatRes = await fetch("/api/user/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ subject: `แลก${coinName}: ${reward.name}`, text: chatText, image: chatImage }),
          });
          const chatData = await chatRes.json();
          if (chatRes.ok && chatData.conversationId) {
            window.dispatchEvent(new CustomEvent("open-livechat", { detail: { conversationId: chatData.conversationId } }));
          } else {
            showToast(true, `แลก "${reward.name}" สำเร็จ!`);
          }
        } catch {
          showToast(true, `แลก "${reward.name}" สำเร็จ!`);
        }
      }

      fetch("/api/honeycomb-rewards").then((r) => r.json()).then((d) => { if (Array.isArray(d)) setRewards(d); });
    } catch (err: any) {
      showToast(false, err.message);
    } finally {
      setRedeeming(null);
    }
  };

  const getEffectiveStock = (r: HoneycombReward) => {
    if (r.type === "shop") return r.shopStock ?? 0;
    return r.stock;
  };

  const CoinDisplay = () => (
    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
      {coinIcon
        ? <img src={coinIcon} alt="" className="w-5 h-5 object-contain" />
        : <span className="text-lg">🍯</span>}
      <span className="font-black text-amber-800 text-sm">{honeyCoins.toLocaleString()}</span>
      <span className="text-[10px] font-bold text-amber-500">{coinName}</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-[#FAFAFA] pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-gray-900">แลก{coinName}</h1>
            <p className="text-xs text-gray-500 font-medium">ใช้{coinName}แลกกล่องสุ่ม ไอเทม และสินค้าพิเศษ</p>
          </div>
          {session && <CoinDisplay />}
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
            {coinIcon ? <img src={coinIcon} alt="" className="w-12 h-12 mx-auto mb-3 opacity-30 object-contain" /> : <span className="text-5xl block mb-3 opacity-30">🍯</span>}
            <p className="font-bold">ยังไม่มีรางวัลให้แลกในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((r) => {
              const effectiveStock = getEffectiveStock(r);
              const isOutOfStock = r.type === "shop" ? effectiveStock === 0 : (r.stock > 0 && effectiveStock === 0);
              const canAfford = !isOutOfStock && honeyCoins >= r.honeyCost;
              const isLoading = redeeming === r._id;

              const img = r.type === "box" ? r.boxId?.image
                : r.type === "shop" ? r.shopListingId?.images?.[0]
                : (r.itemId?.type === "coin_reward" ? null : r.itemId?.image);
              const isCoinRewardItem = r.type === "item" && r.itemId?.type === "coin_reward";

              const typeBadge = r.type === "box" ? { label: "🎁 กล่องสุ่ม", cls: "bg-blue-100 text-blue-700" }
                : r.type === "shop" ? { label: "🛍️ ร้านค้า", cls: "bg-orange-100 text-orange-700" }
                : { label: "📦 ไอเทม", cls: "bg-green-100 text-green-700" };

              return (
                <div key={r._id} className={`bg-white rounded-2xl border-2 overflow-hidden shadow-sm flex flex-col transition-all ${isOutOfStock ? "border-gray-100 opacity-60" : canAfford ? "border-gray-100 hover:border-amber-200 hover:shadow-md" : "border-gray-100 opacity-80"}`}>
                  <div className="relative h-44 bg-gradient-to-br from-amber-50 to-gray-50 flex items-center justify-center p-4">
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
                      coinIcon ? <img src={coinIcon} alt="" className="w-16 h-16 object-contain drop-shadow-lg" /> : <span className="text-7xl drop-shadow-lg">🍯</span>
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
                      </div>
                    )}
                    {r.type === "shop" && r.shopListingId && (
                      <p className="text-xs text-orange-600 font-bold">{r.shopListingId.title}</p>
                    )}

                    <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
                      <div className="flex items-center gap-1.5">
                        {coinIcon
                          ? <img src={coinIcon} alt="" className="w-[15px] h-[15px] object-contain" />
                          : <span className="text-sm">🍯</span>}
                        <span className="font-black text-amber-700 text-base">{r.honeyCost.toLocaleString()}</span>
                        <span className="text-[10px] font-bold text-amber-400 truncate max-w-[60px]">{coinName}</span>
                      </div>
                      <button
                        onClick={() => handleRedeem(r)}
                        disabled={isLoading || !canAfford}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                          isLoading ? "bg-gray-100 text-gray-400 cursor-wait"
                          : isOutOfStock ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : !canAfford ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm active:scale-95"
                        }`}
                      >
                        {isLoading && <Loader2 size={13} className="animate-spin" />}
                        {isLoading ? "กำลังแลก..." : isOutOfStock ? "หมดแล้ว" : canAfford ? "แลกเลย" : "เหรียญไม่พอ"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!session && (
          <div className="text-center mt-8 p-6 bg-amber-50 rounded-2xl border border-amber-100">
            {coinIcon ? <img src={coinIcon} alt="" className="w-8 h-8 mx-auto mb-2 object-contain" /> : <span className="text-3xl block mb-2">🍯</span>}
            <p className="font-bold text-amber-800 mb-3">เข้าสู่ระบบเพื่อแลก{coinName}</p>
            <button onClick={() => setIsLoginOpen(true)} className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">
              เข้าสู่ระบบ
            </button>
          </div>
        )}
      </div>

      {/* Account Data Modal */}
      {accountModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-amber-400 text-white">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 size={20} />
                <span className="font-black text-lg">แลกสำเร็จ!</span>
              </div>
              <p className="text-amber-100 text-sm font-medium">{accountModal.name}</p>
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
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl text-sm transition-colors">
                รับทราบแล้ว
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  );
}
