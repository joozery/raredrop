"use client";

import { useRef, useState } from "react";
import { Plus, X, Loader2, GripVertical } from "lucide-react";

interface Props {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxFiles?: number;
  accept?: string;
}

function isVideo(url: string) {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

function MediaThumb({ url }: { url: string }) {
  if (isVideo(url)) {
    return <video src={url} className="w-full h-full object-cover" autoPlay loop muted playsInline />;
  }
  return <img src={url} alt="" className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = "/product/pokemon.webp"; }} />;
}

export function MultiMediaUpload({
  values,
  onChange,
  folder = "uploads",
  maxFiles = 10,
  accept = "image/*,video/mp4,video/webm,video/mov",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const uploadFile = async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Upload failed");
    return data.url as string;
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxFiles - values.length;
    if (remaining <= 0) { setError(`อัพโหลดได้สูงสุด ${maxFiles} ไฟล์`); return; }

    setUploading(true);
    setError("");
    try {
      const toUpload = Array.from(files).slice(0, remaining);
      const urls = await Promise.all(toUpload.map(uploadFile));
      onChange([...values, ...urls]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="grid grid-cols-3 sm:grid-cols-4 gap-2"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {/* Thumbnails */}
        {values.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
            <MediaThumb url={url} />
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
            {/* Delete */}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700 shadow-md"
            >
              <X size={11} />
            </button>
            {/* Order badge */}
            {i === 0 && (
              <span className="absolute bottom-1 left-1 text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full">
                หลัก
              </span>
            )}
            {isVideo(url) && (
              <span className="absolute top-1 left-1 text-[9px] font-black bg-black/70 text-white px-1.5 py-0.5 rounded-full">
                VDO
              </span>
            )}
            {url.match(/\.gif(\?|$)/i) && (
              <span className="absolute top-1 left-1 text-[9px] font-black bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
                GIF
              </span>
            )}
          </div>
        ))}

        {/* Add button */}
        {values.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-red-400 hover:bg-red-50/40 transition-all flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-red-500 disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-red-500" />
            ) : (
              <>
                <Plus size={22} />
                <span className="text-[10px] font-bold">เพิ่มรูป</span>
              </>
            )}
          </button>
        )}
      </div>

      {error && <p className="text-[11px] text-red-500 font-medium">{error}</p>}

      <p className="text-[10px] text-gray-400 font-medium">
        รองรับ JPG, PNG, GIF, WEBP, MP4, WEBM • สูงสุด {maxFiles} ไฟล์ • รูปแรกจะใช้เป็นภาพหลัก
      </p>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}
