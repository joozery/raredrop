"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, FolderOpen, Upload, X, CheckCircle2, AlertCircle, Loader2, Trash2, ImageIcon } from "lucide-react";

interface RarityData { _id: string; name: string; color: string }
interface CategoryData { _id: string; name: string }

interface PendingItem {
  id: string;
  name: string;
  file: File;
  preview: string;
  price: string;
  error?: string;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

function readFolderEntry(entry: FileSystemDirectoryEntry): Promise<{ name: string; file: File } | null> {
  return new Promise((resolve) => {
    const reader = entry.createReader();
    reader.readEntries((entries) => {
      const imageEntry = (entries as FileSystemFileEntry[]).find(
        (e) => e.isFile && /\.(jpe?g|png|webp|gif)$/i.test(e.name)
      );
      if (!imageEntry) return resolve(null);
      (imageEntry as FileSystemFileEntry).file((f) => resolve({ name: entry.name, file: f }));
    });
  });
}

export default function BulkImportPage() {
  const [rarities, setRarities] = useState<RarityData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // global settings
  const [globalRarity, setGlobalRarity] = useState("");
  const [globalCategory, setGlobalCategory] = useState("");
  const [globalPrice, setGlobalPrice] = useState("");
  const [globalStock, setGlobalStock] = useState("1");
  const [unlimitedStock, setUnlimitedStock] = useState(false);

  // upload state
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [doneCount, setDoneCount] = useState(0);
  const [errorItems, setErrorItems] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.all([fetch("/api/admin/rarities"), fetch("/api/admin/categories")]).then(
      async ([rRes, cRes]) => {
        const r = await rRes.json();
        const c = await cRes.json();
        if (Array.isArray(r)) { setRarities(r); if (r.length) setGlobalRarity(r[0]._id); }
        if (Array.isArray(c)) setCategories(c);
      }
    );
  }, []);

  const addItems = useCallback((newItems: { name: string; file: File }[]) => {
    const items: PendingItem[] = newItems.map((it) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      name: it.name,
      file: it.file,
      preview: URL.createObjectURL(it.file),
      price: "",
    }));
    setPending((prev) => {
      const existingNames = new Set(prev.map((p) => p.name));
      return [...prev, ...items.filter((i) => !existingNames.has(i.name))];
    });
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dtItems = Array.from(e.dataTransfer.items);
    const results: { name: string; file: File }[] = [];

    for (const dtItem of dtItems) {
      const entry = dtItem.webkitGetAsEntry?.();
      if (!entry) continue;

      if (entry.isDirectory) {
        const result = await readFolderEntry(entry as FileSystemDirectoryEntry);
        if (result) results.push(result);
      } else if (entry.isFile && /\.(jpe?g|png|webp|gif)$/i.test(entry.name)) {
        // รูปเดี่ยว — ใช้ชื่อไฟล์ (ไม่มีนามสกุล) เป็นชื่อ item
        const file = await new Promise<File>((res) => (entry as FileSystemFileEntry).file(res));
        results.push({ name: entry.name.replace(/\.[^.]+$/, ""), file });
      }
    }

    if (results.length > 0) addItems(results);
  }, [addItems]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const items = files.map((f) => ({ name: f.name.replace(/\.[^.]+$/, ""), file: f }));
    addItems(items);
    e.target.value = "";
  };

  const removeItem = (id: string) => {
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const updateName = (id: string, name: string) => {
    setPending((prev) => prev.map((p) => p.id === id ? { ...p, name } : p));
  };

  const updatePrice = (id: string, price: string) => {
    setPending((prev) => prev.map((p) => p.id === id ? { ...p, price } : p));
  };

  const handleImport = async () => {
    if (!globalRarity || pending.length === 0) return;
    setStatus("uploading");
    setProgress(0);
    setDoneCount(0);
    setErrorItems([]);

    const uploaded: { name: string; imageUrl: string; price: string }[] = [];
    const errors: string[] = [];

    // อัปโหลดรูปทีละอัน แล้วเก็บ URL
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        fd.append("folder", "items");
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok || !data.url) throw new Error(data.error || "upload failed");
        uploaded.push({ name: item.name, imageUrl: data.url, price: item.price });
      } catch {
        errors.push(item.name);
      }
      setProgress(Math.round(((i + 1) / pending.length) * 70));
    }

    if (uploaded.length === 0) {
      setErrorItems(errors);
      setStatus("error");
      return;
    }

    // สร้าง items ทั้งหมดพร้อมกัน
    try {
      const items = uploaded.map((u) => ({
        name: u.name,
        image: u.imageUrl,
        rarityId: globalRarity,
        categoryId: globalCategory || undefined,
        price: Number(u.price || globalPrice) || 0,
        stock: unlimitedStock ? 0 : (Number(globalStock) || 1),
        unlimitedStock,
      }));

      const res = await fetch("/api/admin/items/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDoneCount(data.created);
    } catch {
      errors.push("(บันทึกฐานข้อมูล)");
    }

    setProgress(100);
    setErrorItems(errors);
    setStatus(errors.length === 0 ? "done" : "error");
    if (errors.length === 0) setPending([]);
  };

  const reset = () => {
    setPending([]);
    setStatus("idle");
    setProgress(0);
    setDoneCount(0);
    setErrorItems([]);
  };

  const effectivePrice = (item: PendingItem) => item.price || globalPrice || "–";

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/items" className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-800">นำเข้า Items จากโฟลเดอร์</h1>
          <p className="text-sm text-slate-500 mt-0.5">ลากโฟลเดอร์มาวาง — ชื่อโฟลเดอร์ = ชื่อ item, รูปภาพในโฟลเดอร์ = รูป item</p>
        </div>
      </div>

      {/* Result banner */}
      {status === "done" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-green-700">นำเข้าสำเร็จ {doneCount} items!</p>
            <p className="text-xs text-green-600 mt-0.5">ตรวจสอบได้ที่หน้า Items</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/items" className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">ดู Items</Link>
            <button onClick={reset} className="px-4 py-2 bg-white border border-green-200 text-green-700 text-xs font-bold rounded-lg hover:bg-green-50 transition-colors">นำเข้าเพิ่ม</button>
          </div>
        </div>
      )}
      {status === "error" && errorItems.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black text-red-700">{doneCount > 0 ? `สำเร็จ ${doneCount} รายการ, ` : ""}มีปัญหา {errorItems.length} รายการ</p>
            <p className="text-xs text-red-500 mt-1">{errorItems.join(", ")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

        {/* Left — Drop zone + preview */}
        <div className="flex flex-col gap-4">

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${isDragging ? "border-red-400 bg-red-50" : "border-slate-200 bg-slate-50/50 hover:border-red-300 hover:bg-red-50/30"}`}
          >
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? "bg-red-100" : "bg-white border border-slate-200"}`}>
              <FolderOpen size={28} className={isDragging ? "text-red-500" : "text-slate-400"} />
            </div>
            <div className="text-center">
              <p className="font-black text-slate-700">ลากโฟลเดอร์มาวางที่นี่</p>
              <p className="text-sm text-slate-400 mt-1">หรือลากไฟล์รูปหลายไฟล์พร้อมกัน</p>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1">
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">JPG PNG WebP GIF</span>
                รองรับวางหลายโฟลเดอร์พร้อมกัน
              </p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileInput} />
          </div>

          {/* Pending items grid */}
          {pending.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <p className="text-sm font-bold text-slate-700">{pending.length} items รอนำเข้า</p>
                <button onClick={() => setPending([])} className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors">ล้างทั้งหมด</button>
              </div>
              <div className="divide-y divide-slate-50">
                {pending.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
                      <img src={item.preview} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateName(item.id, e.target.value)}
                        className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
                      />
                      <div className="flex items-center shrink-0">
                        <span className="text-slate-400 text-xs font-bold mr-1">฿</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updatePrice(item.id, e.target.value)}
                          placeholder={globalPrice || "ราคา"}
                          className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Settings panel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-black text-slate-700">ตั้งค่าทั้งหมด</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ใช้กับทุก item ที่นำเข้า</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">

            {/* Rarity */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">ระดับความหายาก (Rarity) <span className="text-red-500">*</span></label>
              <select
                value={globalRarity}
                onChange={(e) => setGlobalRarity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
              >
                <option value="">— เลือก Rarity —</option>
                {rarities.map((r) => (
                  <option key={r._id} value={r._id}>{r.name}</option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">หมวดหมู่</label>
              <select
                value={globalCategory}
                onChange={(e) => setGlobalCategory(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
              >
                <option value="">— ไม่ระบุหมวดหมู่ —</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Price */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">ราคา (บาท) — ค่า default ทุก item</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                <input
                  type="number"
                  value={globalPrice}
                  onChange={(e) => setGlobalPrice(e.target.value)}
                  placeholder="0"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
                />
              </div>
              <p className="text-[10px] text-slate-400">ราคาที่ตั้งต่อ item จะ override ค่านี้</p>
            </div>

            {/* Stock */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">จำนวนสต็อก</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={globalStock}
                  onChange={(e) => setGlobalStock(e.target.value)}
                  disabled={unlimitedStock}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white disabled:opacity-40 transition-colors"
                />
                <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer shrink-0">
                  <input type="checkbox" checked={unlimitedStock} onChange={(e) => setUnlimitedStock(e.target.checked)} className="rounded" />
                  ไม่จำกัด
                </label>
              </div>
            </div>

            {/* Summary */}
            {pending.length > 0 && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 space-y-1 border border-slate-100">
                <div className="flex justify-between">
                  <span>จำนวน items</span>
                  <span className="font-black text-slate-700">{pending.length} รายการ</span>
                </div>
                <div className="flex justify-between">
                  <span>Rarity</span>
                  <span className="font-black text-slate-700">{rarities.find((r) => r._id === globalRarity)?.name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>ราคา default</span>
                  <span className="font-black text-slate-700">฿{globalPrice || "0"}</span>
                </div>
                <div className="flex justify-between">
                  <span>สต็อก</span>
                  <span className="font-black text-slate-700">{unlimitedStock ? "ไม่จำกัด" : globalStock}</span>
                </div>
              </div>
            )}

            {/* Progress */}
            {status === "uploading" && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" /> กำลังอัปโหลด...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            {/* Import button */}
            <button
              onClick={handleImport}
              disabled={pending.length === 0 || !globalRarity || status === "uploading"}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors shadow-sm text-sm"
            >
              {status === "uploading" ? (
                <><Loader2 size={16} className="animate-spin" /> กำลังนำเข้า...</>
              ) : (
                <><Upload size={16} /> นำเข้า {pending.length} Items</>
              )}
            </button>

            {pending.length === 0 && status === "idle" && (
              <p className="text-center text-xs text-slate-400">ลากโฟลเดอร์มาวางก่อน</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
