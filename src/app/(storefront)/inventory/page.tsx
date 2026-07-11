"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useBalance } from "@/contexts/BalanceContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Package, Truck, ShoppingBag, X, Coins, Search, Filter,
  RefreshCw, AlertCircle, MessageCircle, ExternalLink,
} from "lucide-react";

const DISCORD_TICKET_URL = process.env.NEXT_PUBLIC_DISCORD_TICKET_URL || "";
const LIVECHAT_URL = process.env.NEXT_PUBLIC_LIVECHAT_URL || "";

interface RarityData { name: string; color: string; order: number }
interface ItemData { _id: string; name: string; image: string; price: number; sellPrice?: number; rarityId: RarityData; contactChannels?: { discord: boolean; livechat: boolean } }
interface BoxData { _id: string; name: string; image: string }
interface InventoryItem {
  _id: string; itemId: ItemData; boxId?: BoxData;
  status: "kept" | "sold" | "delivered" | "market"; acquiredAt: string;
}

type ActionType = "sell" | "deliver" | "market" | "unlist" | null;

export default function InventoryPage() {
  const { data: session } = useSession();
  const { refreshBalance } = useBalance();
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRarity, setFilterRarity] = useState("");

  const [actionModal, setActionModal] = useState<{ item: InventoryItem; action: ActionType } | null>(null);
  const [marketPrice, setMarketPrice] = useState<number | "">("");
  const [deliverUid, setDeliverUid] = useState("");
  const [deliverIgn, setDeliverIgn] = useState("");
  const [deliverChannel, setDeliverChannel] = useState<"discord" | "livechat">("livechat");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  useEffect(() => { fetchInventory(); }, [session]);

  const fetchInventory = async () => {
    if (!session) { setLoading(false); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/user/inventory", { cache: "no-store" });
      if (res.ok) setItems(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleAction = async (channel?: "discord" | "livechat") => {
    if (!actionModal || isProcessing) return;
    setIsProcessing(true);
    try {
      const body: any = { action: actionModal.action };
      if (actionModal.action === "market") {
        if (!marketPrice || Number(marketPrice) <= 0) { showToast("กรุณาระบุราคาขาย", false); return; }
        body.price = Number(marketPrice);
      }
      if (actionModal.action === "deliver") {
        if (!deliverUid.trim()) { showToast("กรุณากรอก UID", false); return; }
        if (!deliverIgn.trim()) { showToast("กรุณากรอกชื่อในเกม", false); return; }
        body.uid = deliverUid.trim();
        body.ign = deliverIgn.trim();
        body.channel = channel || "livechat";
      }

      const res = await fetch(`/api/user/inventory/${actionModal.item._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }

      const msgs: Record<string, string> = {
        sell: `ขายคืนสำเร็จ! ได้รับ ฿${data.coinsEarned?.toLocaleString()}`,
        market: "นำขายในตลาดแล้ว",
        unlist: "ถอนออกจากตลาดแล้ว",
        deliver: "ส่งคำขอรับ item แล้ว ทีมงานจะติดต่อกลับ",
      };
      const targetId = actionModal.item._id;
      const targetAction = actionModal.action;
      setActionModal(null);
      setMarketPrice("");
      setDeliverUid("");
      setDeliverIgn("");

      showToast(msgs[targetAction!] || "สำเร็จ");

      if (targetAction === "sell") refreshBalance();

      if (targetAction === "deliver") {
        if (channel === "discord" && DISCORD_TICKET_URL) {
          window.open(DISCORD_TICKET_URL, "_blank");
        } else if (data.ticket?.conversationId) {
          // เด้งไปหน้าแชทและเปิดเคสนี้ให้เลย
          router.push(`/chat?c=${data.ticket.conversationId}`);
        }
      }

      // optimistic update — ไม่ต้องรอ fetchInventory
      if (targetAction === "sell" || targetAction === "deliver") {
        setItems((prev) => prev.filter((i) => i._id !== targetId));
      } else if (targetAction === "market") {
        setItems((prev) => prev.map((i) => i._id === targetId ? { ...i, status: "market" } : i));
      } else if (targetAction === "unlist") {
        setItems((prev) => prev.map((i) => i._id === targetId ? { ...i, status: "kept" } : i));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const rarities = [...new Set(items.map((i) => i.itemId?.rarityId?.name).filter(Boolean))];

  const filtered = items.filter((inv) => {
    const name = inv.itemId?.name?.toLowerCase() || "";
    if (search && !name.includes(search.toLowerCase())) return false;
    if (filterRarity && inv.itemId?.rarityId?.name !== filterRarity) return false;
    return true;
  });

  if (!session) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Package size={48} className="text-gray-200" />
        <h2 className="font-bold text-xl text-gray-700">กรุณาเข้าสู่ระบบ</h2>
        <p className="text-gray-500 text-sm">เพื่อดูคอลเลกชันของคุณ</p>
        <Link href="/?login=1" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors">
          เข้าสู่ระบบ
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">คอลเลกชันของฉัน</h1>
          <p className="text-sm text-gray-500 mt-0.5">ไอเทมทั้งหมดที่คุณได้รับจากการสุ่มกล่อง</p>
        </div>
        <button onClick={fetchInventory} className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600 font-bold text-sm px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors shadow-sm">
          <RefreshCw size={14} /> รีเฟรช
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="ค้นหาชื่อไอเทม..." value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-gray-200 text-sm rounded-xl pl-10 pr-4 py-2.5 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 font-medium text-gray-700 placeholder:text-gray-400 shadow-sm"
          />
        </div>
        <div className="relative">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <select
            value={filterRarity} onChange={(e) => setFilterRarity(e.target.value)}
            className="bg-white border border-gray-200 text-sm rounded-xl pl-10 pr-8 py-2.5 outline-none focus:border-red-400 font-medium text-gray-700 shadow-sm appearance-none cursor-pointer"
          >
            <option value="">ทุกระดับ</option>
            {rarities.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "ไอเทมทั้งหมด", val: items.length, color: "text-gray-900" },
          { label: "เก็บไว้", val: items.filter((i) => i.status === "kept").length, color: "text-blue-600" },
          { label: "ในตลาด", val: items.filter((i) => i.status === "market").length, color: "text-orange-600" },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col items-center">
            <span className={`text-2xl font-black ${s.color}`}>{s.val}</span>
            <span className="text-xs text-gray-500 font-medium mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400">
          <Package size={60} className="opacity-20" />
          <p className="font-bold text-lg">{search || filterRarity ? "ไม่พบไอเทมที่ค้นหา" : "ยังไม่มีไอเทม"}</p>
          {!search && !filterRarity && (
            <Link href="/" className="bg-red-600 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-red-700 transition-colors text-sm">
              ไปเปิดกล่องสุ่ม
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((inv) => {
            const item = inv.itemId;
            const rarity = item?.rarityId;
            const isMarket = inv.status === "market";
            return (
              <div
                key={inv._id}
                className="bg-white rounded-2xl border-2 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col"
                style={{ borderColor: rarity?.color ? `${rarity.color}40` : "#e2e8f0" }}
              >
                {/* Rarity Badge */}
                <div className="px-2 pt-2 pb-0 flex items-center justify-between">
                  <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: rarity?.color ? `${rarity.color}20` : "#f1f5f9", color: rarity?.color || "#64748b" }}>
                    {rarity?.name || "N/A"}
                  </span>
                  {isMarket && (
                    <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">ในตลาด</span>
                  )}
                </div>

                {/* Image */}
                <div className="p-3 flex-1 flex items-center justify-center h-32">
                  {item?.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <Package size={40} className="text-gray-200" />
                  )}
                </div>

                {/* Info */}
                <div className="px-2.5 pb-2">
                  <p className="font-bold text-gray-800 text-xs line-clamp-2 leading-tight mb-1">{item?.name}</p>
                  <p className="text-[10px] text-gray-500 font-medium">มูลค่า ฿{item?.price?.toLocaleString()}</p>
                </div>

                {/* Actions */}
                <div className="px-2 pb-2.5 flex flex-col gap-1.5">
                  {isMarket ? (
                    <button
                      onClick={() => setActionModal({ item: inv, action: "unlist" })}
                      className="w-full text-[10px] font-bold text-orange-600 bg-orange-50 border border-orange-100 py-1.5 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      ถอนออกจากตลาด
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => setActionModal({ item: inv, action: "sell" })}
                        className="w-full text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 py-1.5 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Coins size={10} /> ขายคืน
                      </button>
                      <button
                        onClick={() => {
                          setDeliverUid("");
                          setDeliverIgn("");
                          setDeliverChannel(item?.contactChannels?.livechat === false ? "discord" : "livechat");
                          setActionModal({ item: inv, action: "deliver" });
                        }}
                        className="w-full text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                      >
                        <Truck size={10} /> รับ item
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm" onClick={() => setActionModal(null)}>
          <div className="bg-white w-full max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base">
                {actionModal.action === "sell" && "ขายคืนระบบ"}
                {actionModal.action === "market" && "นำขายในตลาด"}
                {actionModal.action === "deliver" && "รับ item"}
                {actionModal.action === "unlist" && "ถอนออกจากตลาด"}
              </h3>
              <button onClick={() => setActionModal(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              {/* Item Preview */}
              <div className="flex items-center gap-4 bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center p-1">
                  {actionModal.item.itemId?.image ? (
                    <img src={actionModal.item.itemId.image} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Package size={24} className="text-gray-300" />
                  )}
                </div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">{actionModal.item.itemId?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">มูลค่าระบบ ฿{actionModal.item.itemId?.price?.toLocaleString()}</p>
                  {actionModal.item.itemId?.rarityId && (
                    <span className="text-[10px] font-black mt-1 inline-block px-2 py-0.5 rounded-full" style={{ backgroundColor: `${actionModal.item.itemId.rarityId.color}20`, color: actionModal.item.itemId.rarityId.color }}>
                      {actionModal.item.itemId.rarityId.name}
                    </span>
                  )}
                </div>
              </div>

              {actionModal.action === "sell" && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-red-700 text-sm">ยืนยันการขายคืน?</p>
                    <p className="text-xs text-red-600 mt-1">คุณจะได้รับ <strong>฿{(actionModal.item.itemId?.sellPrice ?? actionModal.item.itemId?.price)?.toLocaleString()}</strong> เหรียญ และไอเทมจะถูกลบออกจากคอลเลกชัน</p>
                  </div>
                </div>
              )}

              {actionModal.action === "market" && (
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-bold text-gray-700">ราคาขาย (บาท)</label>
                  <input
                    type="number" min={1} value={marketPrice}
                    onChange={(e) => setMarketPrice(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
                    placeholder="ระบุราคา..."
                  />
                  <p className="text-[11px] text-gray-500">ระบบหัก fee 5% จากยอดขาย</p>
                </div>
              )}

              {actionModal.action === "deliver" && (
                <>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-3">
                    <Truck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-emerald-700 text-sm">รับ item</p>
                      <p className="text-xs text-emerald-600 mt-1">กรอก UID/@username ของคุณ แล้วทีมงานจะติดต่อกลับเพื่อยืนยันการจัดส่ง</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">UID/@username <span className="text-red-500">*</span></label>
                    <input
                      type="text" value={deliverUid}
                      onChange={(e) => setDeliverUid(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
                      placeholder="กรอก UID/@username ของคุณ..."
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">ชื่อในเกม (IGN) <span className="text-red-500">*</span></label>
                    <input
                      type="text" value={deliverIgn}
                      onChange={(e) => setDeliverIgn(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10"
                      placeholder="กรอกชื่อตัวละครในเกม..."
                    />
                    <p className="text-[11px] text-gray-500">UID และชื่อในเกมจะถูกส่งไปให้ทีมงานพร้อมคำขอรับสินค้า</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-bold text-gray-700">ช่องทางติดต่อทีมงาน <span className="text-red-500">*</span></label>
                    <div className="grid grid-cols-2 gap-2">
                      {actionModal.item.itemId?.contactChannels?.livechat !== false && (
                        <button
                          type="button"
                          onClick={() => setDeliverChannel("livechat")}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${deliverChannel === "livechat" ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                        >
                          <MessageCircle size={16} /> แชทในเว็บ
                        </button>
                      )}
                      {actionModal.item.itemId?.contactChannels?.discord !== false && (
                        <button
                          type="button"
                          onClick={() => setDeliverChannel("discord")}
                          className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all ${deliverChannel === "discord" ? "bg-emerald-600 text-white border-emerald-600" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}
                        >
                          <ExternalLink size={16} /> Discord
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {actionModal.action === "unlist" && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-start gap-3">
                  <ShoppingBag size={18} className="text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-orange-700 text-sm">ถอนออกจากตลาด</p>
                    <p className="text-xs text-orange-600 mt-1">ไอเทมจะกลับมาอยู่ในคอลเลกชันของคุณ</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-3">
              <button onClick={() => setActionModal(null)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={() => handleAction(actionModal.action === "deliver" ? deliverChannel : undefined)} disabled={isProcessing} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:bg-gray-400 transition-colors text-sm">
                {isProcessing ? "กำลังดำเนินการ..." : "ยืนยัน"}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-24 lg:bottom-6 left-1/2 -translate-x-1/2 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center gap-2 transition-all ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}

function CheckCircle2({ size, ...props }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
