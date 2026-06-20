"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, CheckCircle2, ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadInput } from "@/components/ui/UploadInput";

interface SettingItem {
  _id: string;
  key: string;
  value: string | number | boolean;
  label: string;
  description?: string;
  type: "text" | "boolean" | "number" | "select" | "textarea";
  group: string;
  options?: string[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [pending, setPending] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [logoSaving, setLogoSaving] = useState(false);
  const [logoSaved, setLogoSaved] = useState(false);
  const [bannerUrl, setBannerUrl] = useState("");
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [gemcoinIcon, setGemcoinIcon] = useState("");
  const [gemcoinIconSaving, setGemcoinIconSaving] = useState(false);
  const [gemcoinIconSaved, setGemcoinIconSaved] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setSettings(d);
          const logoSetting = d.find((s: SettingItem) => s.key === "site_logo");
          if (logoSetting) setLogoUrl(String(logoSetting.value));
          
          const bannerSetting = d.find((s: SettingItem) => s.key === "hero_banner_image");
          if (bannerSetting) setBannerUrl(String(bannerSetting.value));

          const gemcoinIconSetting = d.find((s: SettingItem) => s.key === "gemcoin_icon");
          if (gemcoinIconSetting) setGemcoinIcon(String(gemcoinIconSetting.value));
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveLogo = async () => {
    setLogoSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_logo", value: logoUrl }),
      });
      if (res.ok) {
        setLogoSaved(true);
        setTimeout(() => setLogoSaved(false), 2000);
      }
    } finally {
      setLogoSaving(false);
    }
  };

  const saveBanner = async () => {
    setBannerSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_banner_image", value: bannerUrl }),
      });
      if (res.ok) {
        setBannerSaved(true);
        setTimeout(() => setBannerSaved(false), 2000);
      }
    } finally {
      setBannerSaving(false);
    }
  };

  const saveGemcoinIcon = async () => {
    setGemcoinIconSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "gemcoin_icon", value: gemcoinIcon }),
      });
      if (res.ok) {
        setGemcoinIconSaved(true);
        setTimeout(() => setGemcoinIconSaved(false), 2000);
      }
    } finally {
      setGemcoinIconSaving(false);
    }
  };

  const getValue = (s: SettingItem) =>
    pending[s.key] !== undefined ? pending[s.key] : s.value;

  const handleChange = (key: string, value: string | number | boolean) => {
    setPending((p) => ({ ...p, [key]: value }));
    setSaved((p) => ({ ...p, [key]: false }));
  };

  const handleSave = async (s: SettingItem) => {
    const val = pending[s.key] !== undefined ? pending[s.key] : s.value;
    setSaving((p) => ({ ...p, [s.key]: true }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: s.key, value: val }),
      });
      const data = await res.json();
      if (res.ok) {
        setSettings((prev) =>
          prev.map((item) => (item.key === s.key ? { ...item, value: data.value } : item))
        );
        setPending((p) => { const n = { ...p }; delete n[s.key]; return n; });
        setSaved((p) => ({ ...p, [s.key]: true }));
        setTimeout(() => setSaved((p) => ({ ...p, [s.key]: false })), 2000);
      } else {
        alert(`บันทึกไม่สำเร็จ: ${data.error || "เกิดข้อผิดพลาด"}`);
      }
    } catch {
      alert("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving((p) => ({ ...p, [s.key]: false }));
    }
  };

  const displaySettings = settings.filter((s) => s.key !== "site_logo" && s.key !== "hero_banner_image" && s.key !== "gemcoin_icon");
  const groups = [...new Set(displaySettings.map((s) => s.group))];

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 h-40 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">ตั้งค่าระบบ</h1>
          <p className="text-sm text-slate-500 mt-1">ปรับแต่งพฤติกรรมของแพลตฟอร์ม — การเปลี่ยนแปลงมีผลทันที</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors shrink-0"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {/* Logo Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ImageIcon size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">โลโก้และแบรนด์</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <UploadInput
            label="โลโก้เว็บไซต์"
            value={logoUrl}
            onChange={setLogoUrl}
            folder="branding"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            placeholder="/logo/logo.png หรืออัพโหลดโลโก้"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={saveLogo}
              disabled={logoSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {logoSaving ? <Loader2 size={13} className="animate-spin" /> : logoSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {logoSaved ? "บันทึกแล้ว!" : "บันทึกโลโก้"}
            </button>
            {logoUrl && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ตัวอย่าง:</span>
                <img src={logoUrl} alt="logo preview" className="h-7 object-contain border border-slate-200 rounded p-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Banner Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ImageIcon size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">รูปภาพหน้าหลัก (Hero Banner)</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <UploadInput
            label="อัพโหลดรูปภาพ"
            value={bannerUrl}
            onChange={setBannerUrl}
            folder="banner"
            accept="image/png,image/jpeg,image/webp"
            placeholder="อัพโหลดรูปภาพหน้าหลัก"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={saveBanner}
              disabled={bannerSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {bannerSaving ? <Loader2 size={13} className="animate-spin" /> : bannerSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {bannerSaved ? "บันทึกแล้ว!" : "บันทึกรูปภาพ"}
            </button>
            {bannerUrl && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ตัวอย่าง:</span>
                <img src={bannerUrl} alt="banner preview" className="h-10 object-cover border border-slate-200 rounded p-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* GemCoin Icon Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ImageIcon size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">ไอคอน GemCoin</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <UploadInput
            label="อัพโหลดไอคอน"
            value={gemcoinIcon}
            onChange={setGemcoinIcon}
            folder="branding"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            placeholder="เว้นว่าง = ใช้ไอคอนเหรียญเริ่มต้น"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={saveGemcoinIcon}
              disabled={gemcoinIconSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {gemcoinIconSaving ? <Loader2 size={13} className="animate-spin" /> : gemcoinIconSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {gemcoinIconSaved ? "บันทึกแล้ว!" : "บันทึกไอคอน"}
            </button>
            {gemcoinIcon && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ตัวอย่าง:</span>
                <img src={gemcoinIcon} alt="gemcoin icon preview" className="h-7 w-7 object-contain border border-slate-200 rounded p-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Settings size={15} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">{group}</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {displaySettings
              .filter((s) => s.group === group)
              .map((s) => {
                const currentVal = getValue(s);
                const isDirty = pending[s.key] !== undefined;
                return (
                  <div key={s.key} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800">{s.label}</p>
                      {s.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{s.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {s.type === "boolean" ? (
                        <button
                          onClick={() => handleChange(s.key, !currentVal)}
                          className={cn(
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0",
                            currentVal ? "bg-indigo-500" : "bg-slate-200"
                          )}
                        >
                          <span className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                            currentVal ? "translate-x-6" : "translate-x-1"
                          )} />
                        </button>
                      ) : s.type === "number" ? (
                        <input
                          type="number"
                          value={currentVal as number}
                          onChange={(e) => handleChange(s.key, Number(e.target.value))}
                          className="w-full sm:w-28 px-3 py-1.5 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        />
                      ) : s.type === "textarea" ? (
                        <textarea
                          value={currentVal as string}
                          onChange={(e) => handleChange(s.key, e.target.value)}
                          rows={3}
                          className="w-full sm:w-72 px-3 py-1.5 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 resize-y"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentVal as string}
                          onChange={(e) => handleChange(s.key, e.target.value)}
                          className="w-full sm:w-52 px-3 py-1.5 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        />
                      )}

                      {s.type !== "boolean" && (
                        <button
                          onClick={() => handleSave(s)}
                          disabled={!isDirty || saving[s.key]}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors",
                            isDirty
                              ? "bg-indigo-600 text-white hover:bg-indigo-700"
                              : "bg-slate-100 text-slate-400 cursor-not-allowed"
                          )}
                        >
                          {saving[s.key] ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : saved[s.key] ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Save size={13} />
                          )}
                          {saved[s.key] ? "บันทึกแล้ว" : "บันทึก"}
                        </button>
                      )}

                      {s.type === "boolean" && isDirty && (
                        <button
                          onClick={() => handleSave(s)}
                          disabled={saving[s.key]}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                        >
                          {saving[s.key] ? (
                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : saved[s.key] ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <Save size={13} />
                          )}
                          {saved[s.key] ? "บันทึกแล้ว" : "บันทึก"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}

    </div>
  );
}
