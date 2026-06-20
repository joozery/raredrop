"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { TrendingUp, Plus, Trash2, X, Save, Loader2, Edit2, PackagePlus, Search } from "lucide-react";
import { UploadInput } from "@/components/ui/UploadInput";

interface RewardItem {
  itemId: { _id: string; name: string; image: string; rarityId?: { name: string; color: string } };
  quantity: number;
}

interface LevelConfig {
  _id: string;
  level: number;
  xpRequired: number;
  logoImage?: string;
  tagImage?: string;
  colorTheme?: string;
  rewardItems: RewardItem[];
}

interface ItemOption {
  _id: string;
  name: string;
  image: string;
  rarityId?: { name: string; color: string };
}

const EMPTY_FORM = { level: "", xpRequired: "", logoImage: "", tagImage: "", colorTheme: "gray", rewardItems: [] as { itemId: string; quantity: number }[] };

export default function LevelsPage() {
  const [levels, setLevels] = useState<LevelConfig[]>([]);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [expPerBaht, setExpPerBaht] = useState(1);
  const [expInput, setExpInput] = useState("1");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<LevelConfig | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [savingExp, setSavingExp] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [itemSearch, setItemSearch] = useState("");

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resLevels, resItems] = await Promise.all([
        fetch("/api/admin/levels"),
        fetch("/api/admin/items"),
      ]);
      if (resLevels.ok) {
        const d = await resLevels.json();
        setLevels(d.levels ?? []);
        setExpPerBaht(d.expPerBaht ?? 1);
        setExpInput(String(d.expPerBaht ?? 1));
      }
      if (resItems.ok) setItems(await resItems.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal("create");
  };

  const openEdit = (lv: LevelConfig) => {
    setEditing(lv);
    setForm({
      level: String(lv.level),
      xpRequired: String(lv.xpRequired),
      logoImage: lv.logoImage || "",
      tagImage: lv.tagImage || "",
      colorTheme: lv.colorTheme || "gray",
      rewardItems: lv.rewardItems.map((r) => ({ itemId: r.itemId._id, quantity: r.quantity })),
    });
    setModal("edit");
  };

  const closeModal = () => { setModal(null); setEditing(null); setItemSearch(""); };

  const handleSave = async () => {
    if (!form.level || form.xpRequired === "") { showToast("กรุณากรอกข้อมูลให้ครบ", false); return; }
    setSaving(true);
    try {
      const body = { level: Number(form.level), xpRequired: Number(form.xpRequired), logoImage: form.logoImage, tagImage: form.tagImage, colorTheme: form.colorTheme, rewardItems: form.rewardItems };
      const url = editing ? `/api/admin/levels/${editing._id}` : "/api/admin/levels";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "เกิดข้อผิดพลาด", false); return; }
      showToast(editing ? "อัปเดตสำเร็จ" : "เพิ่มเลเวลสำเร็จ");
      closeModal();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, level: number) => {
    if (!confirm(`ลบ Lv.${level} ใช่ไหม?`)) return;
    const res = await fetch(`/api/admin/levels/${id}`, { method: "DELETE" });
    if (res.ok) { showToast("ลบสำเร็จ"); fetchData(); }
    else showToast("ลบไม่สำเร็จ", false);
  };

  const handleSaveExp = async () => {
    setSavingExp(true);
    try {
      const res = await fetch("/api/admin/levels", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expPerBaht: Number(expInput) }),
      });
      if (res.ok) { setExpPerBaht(Number(expInput)); showToast("บันทึกอัตรา EXP สำเร็จ"); }
      else showToast("บันทึกไม่สำเร็จ", false);
    } finally {
      setSavingExp(false);
    }
  };

  const addRewardItem = (itemId: string) => {
    const exists = form.rewardItems.find((r) => r.itemId === itemId);
    if (exists) {
      setForm((f) => ({ ...f, rewardItems: f.rewardItems.map((r) => r.itemId === itemId ? { ...r, quantity: r.quantity + 1 } : r) }));
    } else {
      setForm((f) => ({ ...f, rewardItems: [...f.rewardItems, { itemId, quantity: 1 }] }));
    }
  };

  const removeRewardItem = (itemId: string) => {
    setForm((f) => ({ ...f, rewardItems: f.rewardItems.filter((r) => r.itemId !== itemId) }));
  };

  const updateRewardQty = (itemId: string, qty: number) => {
    if (qty < 1) return removeRewardItem(itemId);
    setForm((f) => ({ ...f, rewardItems: f.rewardItems.map((r) => r.itemId === itemId ? { ...r, quantity: qty } : r) }));
  };

  const filteredItems = items.filter((i) => i.name.toLowerCase().includes(itemSearch.toLowerCase()));

  const groupedLevels = levels.reduce((acc, lv) => {
    const color = lv.colorTheme || "gray";
    if (!acc[color]) acc[color] = [];
    acc[color].push(lv);
    return acc;
  }, {} as Record<string, LevelConfig[]>);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-indigo-500" /> ระบบเลเวล & EXP
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">ตั้งค่าเลเวล, EXP ที่ต้องการ และของรางวัล</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
        >
          <Plus size={16} /> เพิ่มเลเวล
        </button>
      </div>

      {/* EXP Rate Card */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
        <h2 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
          <span className="text-lg">⚡</span> อัตรา EXP ต่อการเติมเงิน
        </h2>
        <p className="text-xs text-slate-500 mb-4">ผู้เล่นจะได้รับ EXP ตามจำนวนเงินที่เติม เช่น เติม ฿100 ได้ {expPerBaht * 100} EXP</p>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
            <span className="text-sm font-bold text-slate-600">฿1 =</span>
            <input
              type="number"
              value={expInput}
              onChange={(e) => setExpInput(e.target.value)}
              className="w-20 bg-transparent text-sm font-bold text-indigo-600 outline-none text-center"
              min={0}
              step={0.5}
            />
            <span className="text-sm font-bold text-slate-600">EXP</span>
          </div>
          <button
            onClick={handleSaveExp}
            disabled={savingExp}
            className="bg-indigo-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-indigo-700 disabled:bg-slate-400 transition-colors flex items-center gap-2"
          >
            {savingExp ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            บันทึก
          </button>
        </div>
      </div>

      {/* Levels Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
        </div>
      ) : levels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-slate-400 bg-white rounded-2xl border border-slate-100">
          <TrendingUp size={48} className="opacity-20" />
          <p className="font-bold">ยังไม่มีการตั้งค่าเลเวล</p>
          <p className="text-sm text-slate-400">เพิ่มการตั้งค่าเลเวล (เริ่มจากเลเวล 1 XP 0 ก็ได้)</p>
          <button onClick={openCreate} className="bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:bg-indigo-700">
            เพิ่มเลเวลแรก
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">เลเวล</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">XP ที่ต้องการ</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ของรางวัล</th>
                <th className="py-3.5 px-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100/80">
              {Object.entries(groupedLevels).map(([color, lvs]) => (
                <Fragment key={color}>
                  <tr className="border-y border-slate-200 shadow-sm" style={{ backgroundColor: color.startsWith("#") ? `${color}30` : "#f8fafc" }}>
                    <td colSpan={4} className="py-2.5 px-6 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-black/20 shadow-inner" style={{ backgroundColor: color.startsWith("#") ? color : "transparent" }} />
                        <span>ธีมสี: <span className="font-medium text-slate-600">{color}</span></span>
                      </div>
                    </td>
                  </tr>
                  {lvs.map((lv) => (
                    <tr key={lv._id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {lv.logoImage ? (
                            <img src={lv.logoImage} alt={`Lv.${lv.level}`} className="w-10 h-10 object-contain drop-shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                              <span className="font-black text-indigo-600 text-sm">{lv.level}</span>
                            </div>
                          )}
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                              Lv.{lv.level}
                              {lv.tagImage && <img src={lv.tagImage} alt="Tag" className="h-5 object-contain" />}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-black text-slate-800">{lv.xpRequired.toLocaleString()}</span>
                        <span className="text-xs text-slate-400 ml-1">XP</span>
                      </td>
                      <td className="py-4 px-6">
                        {lv.rewardItems.length === 0 ? (
                          <span className="text-slate-400 text-xs">ไม่มีของรางวัล</span>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {lv.rewardItems.map((r, i) => (
                              <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                                <img src={r.itemId?.image} alt={r.itemId?.name} className="w-6 h-6 rounded object-cover" />
                                <span className="text-[11px] font-bold text-slate-700 max-w-[80px] truncate">{r.itemId?.name}</span>
                                <span className="text-[10px] text-slate-400 font-medium">×{r.quantity}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEdit(lv)}
                            className="text-slate-500 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors flex items-center gap-1"
                          >
                            <Edit2 size={11} /> แก้ไข
                          </button>
                          <button
                            onClick={() => handleDelete(lv._id, lv.level)}
                            className="text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={closeModal}>
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h3 className="font-bold text-slate-900">{editing ? "แก้ไขเลเวล" : "เพิ่มเลเวล"}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">เลเวล *</label>
                  <input
                    type="number"
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-bold text-slate-800"
                    placeholder="2"
                    min={2}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">XP ที่ต้องการ *</label>
                  <input
                    type="number"
                    value={form.xpRequired}
                    onChange={(e) => setForm((f) => ({ ...f, xpRequired: e.target.value }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 font-bold text-slate-800"
                    placeholder="100"
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <UploadInput
                    label="โลโก้เลเวล (โลโก้ใหญ่ในการ์ด)"
                    value={form.logoImage || ""}
                    onChange={(url) => setForm((f) => ({ ...f, logoImage: url }))}
                    folder="levels"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    placeholder="คลิกเพื่ออัพโหลด"
                  />
                  <UploadInput
                    label="ป้าย Tag (ข้างชื่อโปรไฟล์)"
                    value={form.tagImage || ""}
                    onChange={(url) => setForm((f) => ({ ...f, tagImage: url }))}
                    folder="levels"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    placeholder="คลิกเพื่ออัพโหลดป้าย"
                  />
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-600">ธีมสีพื้นหลังของการ์ดเลเวล</label>
                  <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                    <input
                      type="color"
                      value={form.colorTheme.startsWith("#") ? form.colorTheme : "#e2e8f0"}
                      onChange={(e) => setForm((f) => ({ ...f, colorTheme: e.target.value }))}
                      className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                    />
                    <input
                      type="text"
                      value={form.colorTheme}
                      onChange={(e) => setForm((f) => ({ ...f, colorTheme: e.target.value }))}
                      className="bg-transparent text-sm outline-none font-bold text-slate-800 flex-1"
                      placeholder="ใส่ HEX Color (เช่น #f1f1f2 หรือ gray)"
                    />
                  </div>
                </div>
              </div>

              {/* Reward Items */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-600 flex items-center gap-1"><PackagePlus size={13} /> ของรางวัล <span className="font-normal text-slate-400">(ไม่บังคับ)</span></label>

                {/* Selected items */}
                {form.rewardItems.length > 0 && (
                  <div className="flex flex-wrap gap-2 bg-indigo-50/50 border border-indigo-100 rounded-xl p-3">
                    {form.rewardItems.map((r) => {
                      const item = items.find((i) => i._id === r.itemId);
                      return (
                        <div key={r.itemId} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg pl-1.5 pr-1 py-1 shadow-sm">
                          <img src={item?.image} alt={item?.name} className="w-6 h-6 rounded object-cover" />
                          <span className="text-[11px] font-bold text-slate-700 max-w-[70px] truncate">{item?.name}</span>
                          <div className="flex items-center gap-0.5 ml-1">
                            <button onClick={() => updateRewardQty(r.itemId, r.quantity - 1)} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">-</button>
                            <span className="text-[11px] font-bold text-slate-800 w-5 text-center">{r.quantity}</span>
                            <button onClick={() => updateRewardQty(r.itemId, r.quantity + 1)} className="w-4 h-4 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold flex items-center justify-center">+</button>
                          </div>
                          <button onClick={() => removeRewardItem(r.itemId)} className="ml-0.5 text-slate-400 hover:text-red-500"><X size={11} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Item search & list */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50">
                    <Search size={13} className="text-slate-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาไอเทม..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="flex-1 bg-transparent text-xs outline-none text-slate-700 placeholder-slate-400"
                    />
                  </div>
                  <div className="max-h-44 overflow-y-auto">
                    {filteredItems.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">ไม่พบไอเทม</p>
                    ) : (
                      filteredItems.map((item) => {
                        const selected = form.rewardItems.find((r) => r.itemId === item._id);
                        return (
                          <button
                            key={item._id}
                            onClick={() => addRewardItem(item._id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selected ? "bg-indigo-50/50" : ""}`}
                          >
                            <img src={item.image} alt={item.name} className="w-8 h-8 rounded-lg object-cover border border-slate-100 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                              {item.rarityId && (
                                <p className="text-[10px] font-medium" style={{ color: item.rarityId.color }}>{item.rarityId.name}</p>
                              )}
                            </div>
                            {selected && <span className="text-[10px] font-bold text-indigo-600 shrink-0">×{selected.quantity}</span>}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex gap-3 shrink-0">
              <button onClick={closeModal} className="flex-1 bg-slate-100 text-slate-600 font-bold py-3 rounded-xl hover:bg-slate-200 transition-colors text-sm">
                ยกเลิก
              </button>
              <button onClick={handleSave} disabled={saving} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 disabled:bg-slate-400 transition-colors text-sm flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-6 left-6 right-6 sm:left-auto sm:right-6 z-[300] px-5 py-3 rounded-2xl shadow-xl font-bold text-sm text-white flex items-center justify-center gap-2 ${toast.ok ? "bg-emerald-600" : "bg-red-600"}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}
    </div>
  );
}
