"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, FolderOpen, Upload, X, CheckCircle2, AlertCircle, Loader2, Film, Image as ImageIcon, Star } from "lucide-react";

interface CategoryOption { _id: string; name: string }

interface MediaPreview {
  id: string;
  url: string;
  isVideo: boolean;
  file: File;
}

interface PendingListing {
  id: string;
  title: string;
  medias: MediaPreview[];
  price: string;
}

type UploadStatus = "idle" | "uploading" | "done" | "error";

const MEDIA_REGEX = /\.(jpe?g|png|webp|gif|mp4|webm)$/i;
const VIDEO_REGEX = /\.(mp4|webm)$/i;

function readAllEntries(dir: FileSystemDirectoryEntry): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const reader = dir.createReader();
    const all: FileSystemEntry[] = [];
    function batch() {
      reader.readEntries((entries) => {
        if (entries.length === 0) resolve(all);
        else { all.push(...entries); batch(); }
      }, reject);
    }
    batch();
  });
}

async function readFolderMediaFiles(dir: FileSystemDirectoryEntry): Promise<File[]> {
  const entries = await readAllEntries(dir);
  const mediaEntries = entries.filter((e) => e.isFile && MEDIA_REGEX.test(e.name)) as FileSystemFileEntry[];
  return Promise.all(mediaEntries.map((e) => new Promise<File>((res) => e.file(res))));
}

async function processDroppedEntry(entry: FileSystemEntry): Promise<{ title: string; files: File[] }[]> {
  if (entry.isFile) {
    if (!MEDIA_REGEX.test(entry.name)) return [];
    const file = await new Promise<File>((res) => (entry as FileSystemFileEntry).file(res));
    return [{ title: entry.name.replace(/\.[^.]+$/, ""), files: [file] }];
  }
  if (entry.isDirectory) {
    const dir = entry as FileSystemDirectoryEntry;
    const entries = await readAllEntries(dir);
    const mediaFiles = entries.filter((e) => e.isFile && MEDIA_REGEX.test(e.name));
    if (mediaFiles.length > 0) {
      const files = await readFolderMediaFiles(dir);
      return [{ title: dir.name, files }];
    }
    const subDirs = entries.filter((e) => e.isDirectory);
    const results: { title: string; files: File[] }[] = [];
    for (const sub of subDirs) results.push(...await processDroppedEntry(sub));
    return results;
  }
  return [];
}

function isVideoFile(f: File) {
  return VIDEO_REGEX.test(f.name) || f.type.startsWith("video/");
}

function makeMediaId() {
  return `m-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function ShopBulkImportPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [pending, setPending] = useState<PendingListing[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [globalCategory, setGlobalCategory] = useState("");
  const [globalPrice, setGlobalPrice] = useState("");
  const [globalStock, setGlobalStock] = useState("1");
  const [globalStatus, setGlobalStatus] = useState<"active" | "hidden">("active");

  const [status, setStatus] = useState<UploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const [doneCount, setDoneCount] = useState(0);
  const [errorItems, setErrorItems] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/shop-categories").then((r) => r.json()).then((d) => {
      if (Array.isArray(d)) setCategories(d);
    });
  }, []);

  const addListings = useCallback((newItems: { title: string; files: File[] }[]) => {
    const items: PendingListing[] = newItems
      .filter((it) => it.files.length > 0)
      .map((it) => ({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: it.title,
        medias: it.files.map((f) => ({
          id: makeMediaId(),
          url: URL.createObjectURL(f),
          isVideo: isVideoFile(f),
          file: f,
        })),
        price: "",
      }));
    setPending((prev) => {
      const existing = new Set(prev.map((p) => p.title));
      return [...prev, ...items.filter((i) => !existing.has(i.title))];
    });
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const results: { title: string; files: File[] }[] = [];
    for (const dtItem of Array.from(e.dataTransfer.items)) {
      const entry = dtItem.webkitGetAsEntry?.();
      if (entry) results.push(...await processDroppedEntry(entry));
    }
    if (results.length > 0) addListings(results);
  }, [addListings]);

  const removeItem = (id: string) => setPending((prev) => prev.filter((p) => p.id !== id));
  const updateTitle = (id: string, title: string) => setPending((prev) => prev.map((p) => p.id === id ? { ...p, title } : p));
  const updatePrice = (id: string, price: string) => setPending((prev) => prev.map((p) => p.id === id ? { ...p, price } : p));
  const setCover = (listingId: string, mediaId: string) => {
    setPending((prev) => prev.map((p) => {
      if (p.id !== listingId) return p;
      const idx = p.medias.findIndex((m) => m.id === mediaId);
      if (idx <= 0) return p;
      const newMedias = [...p.medias];
      const [picked] = newMedias.splice(idx, 1);
      newMedias.unshift(picked);
      return { ...p, medias: newMedias };
    }));
  };
  const removeMedia = (listingId: string, mediaId: string) => {
    setPending((prev) => prev.map((p) => p.id === listingId
      ? { ...p, medias: p.medias.filter((m) => m.id !== mediaId) }
      : p
    ).filter((p) => p.medias.length > 0));
  };

  const handleImport = async () => {
    if (pending.length === 0) return;
    setStatus("uploading");
    setProgress(0);
    setProgressLabel("");
    setDoneCount(0);
    setErrorItems([]);

    const totalFiles = pending.reduce((s, p) => s + p.medias.length, 0);
    let uploadedFiles = 0;
    const uploaded: { title: string; urls: string[]; price: string }[] = [];
    const errors: string[] = [];

    for (const listing of pending) {
      setProgressLabel(`"${listing.title}"`);
      const urls: string[] = [];
      let failed = false;
      for (const media of listing.medias) {
        try {
          const fd = new FormData();
          fd.append("file", media.file);
          fd.append("folder", "shop");
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || "upload failed");
          urls.push(data.url);
        } catch { failed = true; }
        uploadedFiles++;
        setProgress(Math.round((uploadedFiles / totalFiles) * 80));
      }
      if (failed && urls.length === 0) errors.push(listing.title);
      else uploaded.push({ title: listing.title, urls, price: listing.price });
    }

    if (uploaded.length === 0) { setErrorItems(errors); setStatus("error"); return; }

    setProgressLabel("บันทึกฐานข้อมูล...");
    try {
      const listings = uploaded.map((u) => ({
        title: u.title,
        images: u.urls,
        price: Number(u.price || globalPrice) || 0,
        categoryId: globalCategory || undefined,
        status: globalStatus,
        stockCount: Number(globalStock) || 0,
      }));
      const res = await fetch("/api/admin/shop/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDoneCount(data.created);
    } catch { errors.push("(บันทึกฐานข้อมูล)"); }

    setProgress(100);
    setProgressLabel("");
    setErrorItems(errors);
    setStatus(errors.length === 0 ? "done" : "error");
    if (errors.length === 0) setPending([]);
  };

  const reset = () => { setPending([]); setStatus("idle"); setProgress(0); setProgressLabel(""); setDoneCount(0); setErrorItems([]); };
  const totalMedias = pending.reduce((s, p) => s + p.medias.length, 0);

  return (
    <div className="flex flex-col gap-6 max-w-5xl">

      <div className="flex items-center gap-3">
        <Link href="/admin/shop" className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 shadow-sm transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-slate-800">นำเข้าสินค้าจากโฟลเดอร์</h1>
          <p className="text-sm text-slate-500 mt-0.5">1 โฟลเดอร์ = 1 สินค้า — ลากจัดเรียงรูปได้ อันแรก = หน้าปก</p>
        </div>
      </div>

      {status === "done" && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4">
          <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          <div className="flex-1">
            <p className="font-black text-green-700">นำเข้าสำเร็จ {doneCount} สินค้า!</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/shop" className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 transition-colors">ดู Shop</Link>
            <button onClick={reset} className="px-4 py-2 bg-white border border-green-200 text-green-700 text-xs font-bold rounded-lg hover:bg-green-50 transition-colors">นำเข้าเพิ่ม</button>
          </div>
        </div>
      )}
      {status === "error" && errorItems.length > 0 && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-black text-red-700">{doneCount > 0 ? `สำเร็จ ${doneCount} สินค้า, ` : ""}มีปัญหา {errorItems.length} รายการ</p>
            <p className="text-xs text-red-500 mt-1">{errorItems.join(", ")}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
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
              <p className="font-black text-slate-700">ลากโฟลเดอร์สินค้ามาวางที่นี่</p>
              <p className="text-sm text-slate-400 mt-1">วางหลายโฟลเดอร์พร้อมกันได้ — ลากรูปเพื่อจัดลำดับ</p>
              <p className="text-xs text-slate-400 mt-2 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono text-[10px]">JPG PNG WebP GIF</span>
                <span className="bg-violet-100 text-violet-600 px-2 py-0.5 rounded font-mono text-[10px]">MP4 WebM</span>
              </p>
            </div>
            <input ref={fileInputRef} type="file" multiple accept="image/*,video/mp4,video/webm" className="hidden" onChange={(e) => {
              const files = Array.from(e.target.files || []);
              addListings(files.filter((f) => MEDIA_REGEX.test(f.name)).map((f) => ({ title: f.name.replace(/\.[^.]+$/, ""), files: [f] })));
              e.target.value = "";
            }} />
          </div>

          {/* Listing cards */}
          {pending.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <p className="text-sm font-bold text-slate-700">{pending.length} สินค้า</p>
                  <span className="text-[11px] text-slate-400">{totalMedias} ไฟล์รวม</span>
                </div>
                <button onClick={() => setPending([])} className="text-xs text-slate-400 hover:text-red-500 font-bold transition-colors">ล้างทั้งหมด</button>
              </div>

              <div className="divide-y divide-slate-50">
                {pending.map((listing) => (
                  <div key={listing.id} className="px-4 py-4 flex flex-col gap-3">

                    {/* Title + price row */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={listing.title}
                        onChange={(e) => updateTitle(listing.id, e.target.value)}
                        className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
                      />
                      <div className="flex items-center shrink-0">
                        <span className="text-slate-400 text-xs font-bold mr-1">฿</span>
                        <input
                          type="number"
                          value={listing.price}
                          onChange={(e) => updatePrice(listing.id, e.target.value)}
                          placeholder={globalPrice || "ราคา"}
                          className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors"
                        />
                      </div>
                      <button onClick={() => removeItem(listing.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0">
                        <X size={14} />
                      </button>
                    </div>

                    {/* Media strip — คลิกเพื่อตั้งเป็นหน้าปก */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {listing.medias.map((media, idx) => (
                        <div key={media.id} className="relative shrink-0">
                          <div
                            onClick={() => setCover(listing.id, media.id)}
                            className={`w-16 h-16 rounded-xl overflow-hidden border-2 bg-slate-900 relative group cursor-pointer transition-all ${idx === 0 ? "border-red-500 ring-2 ring-red-200" : "border-slate-200 hover:border-red-300"}`}
                          >
                            {media.isVideo ? (
                              <>
                                <video src={media.url} className="w-full h-full object-cover" muted playsInline />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                    <Film size={11} className="text-white" />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <img src={media.url} alt="" className="w-full h-full object-cover" draggable={false} />
                            )}

                            {/* hover overlay — ตั้งเป็นปก */}
                            {idx !== 0 && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                <Star size={14} className="text-yellow-400 fill-yellow-400" />
                              </div>
                            )}

                            {/* ลบ */}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeMedia(listing.id, media.id); }}
                              className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                            >
                              <X size={8} className="text-white" />
                            </button>
                          </div>

                          {idx === 0 && (
                            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full whitespace-nowrap z-10 flex items-center gap-0.5">
                              <Star size={6} className="fill-white" /> ปก
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 flex items-center gap-2">
                      {listing.medias.filter((m) => !m.isVideo).length > 0 && (
                        <span className="flex items-center gap-0.5"><ImageIcon size={9} /> {listing.medias.filter((m) => !m.isVideo).length} รูป</span>
                      )}
                      {listing.medias.filter((m) => m.isVideo).length > 0 && (
                        <span className="flex items-center gap-0.5"><Film size={9} /> {listing.medias.filter((m) => m.isVideo).length} วิดีโอ</span>
                      )}
                      <span className="text-slate-300">— คลิกรูปเพื่อตั้งเป็นหน้าปก</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Settings panel */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <p className="text-sm font-black text-slate-700">ตั้งค่าทั้งหมด</p>
            <p className="text-[11px] text-slate-400 mt-0.5">ใช้กับทุกสินค้าที่นำเข้า</p>
          </div>
          <div className="px-5 py-5 flex flex-col gap-4">

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">หมวดหมู่</label>
              <select value={globalCategory} onChange={(e) => setGlobalCategory(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors">
                <option value="">— ไม่ระบุหมวดหมู่ —</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">ราคา (บาท) — ค่า default</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">฿</span>
                <input type="number" value={globalPrice} onChange={(e) => setGlobalPrice(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors" />
              </div>
              <p className="text-[10px] text-slate-400">ราคาต่อสินค้าจะ override ค่านี้</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">จำนวนสต็อก</label>
              <input type="number" min="0" value={globalStock} onChange={(e) => setGlobalStock(e.target.value)} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 outline-none focus:border-red-400 focus:bg-white transition-colors" />
              <p className="text-[10px] text-slate-400">สร้าง slot สต็อกตามจำนวน — กรอกข้อมูล account ทีหลังในหน้า Shop</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-600">สถานะสินค้า</label>
              <div className="flex gap-2">
                <button onClick={() => setGlobalStatus("active")} className={`flex-1 py-2 rounded-xl text-xs font-black border transition-colors ${globalStatus === "active" ? "bg-emerald-600 text-white border-emerald-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"}`}>เปิดขาย</button>
                <button onClick={() => setGlobalStatus("hidden")} className={`flex-1 py-2 rounded-xl text-xs font-black border transition-colors ${globalStatus === "hidden" ? "bg-slate-700 text-white border-slate-700" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"}`}>ซ่อน</button>
              </div>
            </div>

            {pending.length > 0 && (
              <div className="bg-slate-50 rounded-xl px-4 py-3 text-xs text-slate-500 space-y-1 border border-slate-100">
                <div className="flex justify-between"><span>จำนวนสินค้า</span><span className="font-black text-slate-700">{pending.length} รายการ</span></div>
                <div className="flex justify-between"><span>ไฟล์รวม</span><span className="font-black text-slate-700">{totalMedias} ไฟล์</span></div>
                <div className="flex justify-between"><span>หมวดหมู่</span><span className="font-black text-slate-700">{categories.find((c) => c._id === globalCategory)?.name || "ไม่ระบุ"}</span></div>
                <div className="flex justify-between"><span>ราคา default</span><span className="font-black text-slate-700">฿{globalPrice || "0"}</span></div>
                <div className="flex justify-between"><span>สต็อกต่อสินค้า</span><span className="font-black text-slate-700">{globalStock || "0"} slot</span></div>
                <div className="flex justify-between"><span>สถานะ</span><span className={`font-black ${globalStatus === "active" ? "text-emerald-600" : "text-slate-500"}`}>{globalStatus === "active" ? "เปิดขาย" : "ซ่อน"}</span></div>
              </div>
            )}

            {status === "uploading" && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs font-bold text-slate-600">
                  <span className="flex items-center gap-1.5"><Loader2 size={12} className="animate-spin" />{progressLabel || "กำลังอัปโหลด..."}</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={pending.length === 0 || status === "uploading"}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-black rounded-xl transition-colors shadow-sm text-sm"
            >
              {status === "uploading" ? (
                <><Loader2 size={16} className="animate-spin" /> กำลังนำเข้า...</>
              ) : (
                <><Upload size={16} /> นำเข้า {pending.length} สินค้า ({totalMedias} ไฟล์)</>
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
