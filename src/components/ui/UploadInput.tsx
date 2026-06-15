"use client";

import { useRef, useState } from "react";
import { Upload, X, Loader2, Film, Image as ImageIcon } from "lucide-react";

interface Props {
  value: string;
  onChange: (url: string) => void;
  accept?: string;
  folder?: string;
  label?: string;
  placeholder?: string;
  isVideo?: boolean;
}

export function UploadInput({
  value,
  onChange,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  folder = "uploads",
  label,
  placeholder = "https://... หรืออัพโหลดไฟล์",
  isVideo = false,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isVideoUrl = (url: string) => url.match(/\.(mp4|webm|mov)$/i);

  const handleFile = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("folder", folder);

      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Upload failed");
      onChange(data.url);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const Preview = () => {
    if (!value) return null;
    if (isVideoUrl(value)) {
      return (
        <video
          src={value}
          className="w-full h-full object-cover"
          autoPlay loop muted playsInline
        />
      );
    }
    return <img src={value} alt="preview" className="w-full h-full object-contain" />;
  };

  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
          {isVideo ? <Film size={13} /> : <ImageIcon size={13} />}
          {label}
        </label>
      )}

      <div className="flex items-start gap-3">
        {/* Preview Box */}
        <div
          className="w-16 h-16 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-red-400 transition-colors relative group"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? (
            <Loader2 size={20} className="text-red-500 animate-spin" />
          ) : value ? (
            <>
              <Preview />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Upload size={14} className="text-white" />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <Upload size={16} className="text-slate-400" />
              <span className="text-[9px] text-slate-400 font-bold">อัพ</span>
            </div>
          )}
        </div>

        {/* URL Input + Upload Button */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex gap-2">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-red-500 transition-all font-medium text-slate-800"
              placeholder={placeholder}
            />
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-400 text-white rounded-lg text-xs font-bold transition-colors shrink-0"
            >
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {uploading ? "..." : "อัพโหลด"}
            </button>
          </div>

          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="text-[10px] text-red-400 hover:text-red-600 font-medium flex items-center gap-1 w-fit"
            >
              <X size={10} /> ลบไฟล์
            </button>
          )}

          {error && (
            <p className="text-[10px] text-red-500 font-medium">{error}</p>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
