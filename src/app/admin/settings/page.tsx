"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, CheckCircle2, ImageIcon, Loader2, ScanLine, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UploadInput } from "@/components/ui/UploadInput";

interface HeroBannerData {
  image: string;
  link: string;
}

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
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [ogImageSaving, setOgImageSaving] = useState(false);
  const [ogImageSaved, setOgImageSaved] = useState(false);
  const [heroBanners, setHeroBanners] = useState<HeroBannerData[]>([{ image: "", link: "" }]);
  const [bannerSaving, setBannerSaving] = useState(false);
  const [bannerSaved, setBannerSaved] = useState(false);
  const [knowledgeBannerUrl, setKnowledgeBannerUrl] = useState("");
  const [knowledgeBannerLink, setKnowledgeBannerLink] = useState("");
  const [knowledgeBannerSaving, setKnowledgeBannerSaving] = useState(false);
  const [knowledgeBannerSaved, setKnowledgeBannerSaved] = useState(false);
  const [gemcoinIcon, setGemcoinIcon] = useState("");
  const [gemcoinIconSaving, setGemcoinIconSaving] = useState(false);
  const [gemcoinIconSaved, setGemcoinIconSaved] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [paymentMethodSaving, setPaymentMethodSaving] = useState(false);
  const [paymentQrImage, setPaymentQrImage] = useState("");
  const [qrImageSaving, setQrImageSaving] = useState(false);
  const [qrImageSaved, setQrImageSaved] = useState(false);
  const [qrDecoding, setQrDecoding] = useState(false);
  const [qrDecodeError, setQrDecodeError] = useState("");
  const [qrDecodeResult, setQrDecodeResult] = useState<{ type: string; shopName?: string; accountType?: string; accountNumber?: string } | null>(null);
  const [popupImage, setPopupImage] = useState("");
  const [popupLink, setPopupLink] = useState("");
  const [popupSaving, setPopupSaving] = useState(false);
  const [popupSaved, setPopupSaved] = useState(false);

  const fetchSettings = () => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d)) {
          setSettings(d);
          const logoSetting = d.find((s: SettingItem) => s.key === "site_logo");
          if (logoSetting) setLogoUrl(String(logoSetting.value));

          const ogImageSetting = d.find((s: SettingItem) => s.key === "site_og_image");
          if (ogImageSetting) setOgImageUrl(String(ogImageSetting.value));
          
          const heroCarouselSetting = d.find((s: SettingItem) => s.key === "hero_banner_carousel");
          if (heroCarouselSetting && Array.isArray(heroCarouselSetting.value) && heroCarouselSetting.value.length > 0) {
            setHeroBanners(heroCarouselSetting.value as HeroBannerData[]);
          } else {
            const legacyBanner = d.find((s: SettingItem) => s.key === "hero_banner_image");
            const legacyLink = d.find((s: SettingItem) => s.key === "hero_banner_link");
            if (legacyBanner?.value) {
              setHeroBanners([{ image: String(legacyBanner.value), link: String(legacyLink?.value || "") }]);
            }
          }

          const knowledgeBannerSetting = d.find((s: SettingItem) => s.key === "knowledge_hero_image");
          if (knowledgeBannerSetting) setKnowledgeBannerUrl(String(knowledgeBannerSetting.value));

          const knowledgeBannerLinkSetting = d.find((s: SettingItem) => s.key === "knowledge_hero_link");
          if (knowledgeBannerLinkSetting) setKnowledgeBannerLink(String(knowledgeBannerLinkSetting.value));

          const gemcoinIconSetting = d.find((s: SettingItem) => s.key === "gemcoin_icon");
          if (gemcoinIconSetting) setGemcoinIcon(String(gemcoinIconSetting.value));

          const paymentMethodSetting = d.find((s: SettingItem) => s.key === "payment_method");
          if (paymentMethodSetting) setPaymentMethod(String(paymentMethodSetting.value));

          const paymentQrImageSetting = d.find((s: SettingItem) => s.key === "payment_qr_image");
          if (paymentQrImageSetting) setPaymentQrImage(String(paymentQrImageSetting.value));

          const qrType = d.find((s: SettingItem) => s.key === "payment_qr_type")?.value;
          const qrAccountType = d.find((s: SettingItem) => s.key === "payment_qr_account_type")?.value;
          const qrAccountNumber = d.find((s: SettingItem) => s.key === "payment_qr_account_number")?.value;
          const qrShopName = d.find((s: SettingItem) => s.key === "payment_qr_shop_name")?.value;
          if (qrType) {
            setQrDecodeResult({
              type: String(qrType),
              accountType: qrAccountType ? String(qrAccountType) : undefined,
              accountNumber: qrAccountNumber ? String(qrAccountNumber) : undefined,
              shopName: qrShopName ? String(qrShopName) : undefined,
            });
          }

          const popupImageSetting = d.find((s: SettingItem) => s.key === "popup_image");
          if (popupImageSetting) setPopupImage(String(popupImageSetting.value));

          const popupLinkSetting = d.find((s: SettingItem) => s.key === "popup_link");
          if (popupLinkSetting) setPopupLink(String(popupLinkSetting.value));
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

  const saveOgImage = async () => {
    setOgImageSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "site_og_image", value: ogImageUrl }),
      });
      if (res.ok) {
        setOgImageSaved(true);
        setTimeout(() => setOgImageSaved(false), 2000);
      }
    } finally {
      setOgImageSaving(false);
    }
  };

  const saveBannersArray = async () => {
    setBannerSaving(true);
    try {
      const validBanners = heroBanners.filter(b => b.image);
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "hero_banner_carousel", value: validBanners }),
      });
      setBannerSaved(true);
      setTimeout(() => setBannerSaved(false), 2000);
    } finally {
      setBannerSaving(false);
    }
  };

  const saveKnowledgeBanner = async () => {
    setKnowledgeBannerSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "knowledge_hero_image", value: knowledgeBannerUrl }),
      });
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "knowledge_hero_link", value: knowledgeBannerLink }),
      });
      setKnowledgeBannerSaved(true);
      setTimeout(() => setKnowledgeBannerSaved(false), 2000);
    } finally {
      setKnowledgeBannerSaving(false);
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

  const savePaymentMethod = async (method: string) => {
    setPaymentMethodSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payment_method", value: method }),
      });
      if (res.ok) setPaymentMethod(method);
    } finally {
      setPaymentMethodSaving(false);
    }
  };

  const saveQrImage = async () => {
    setQrImageSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "payment_qr_image", value: paymentQrImage }),
      });
      if (res.ok) {
        setQrImageSaved(true);
        setTimeout(() => setQrImageSaved(false), 2000);
      }
    } finally {
      setQrImageSaving(false);
    }
  };

  const decodeQr = async () => {
    if (!paymentQrImage) return;
    setQrDecoding(true);
    setQrDecodeError("");
    try {
      const res = await fetch("/api/admin/settings/decode-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: paymentQrImage }),
      });
      const data = await res.json();
      if (!res.ok) {
        setQrDecodeError(data.error || "ถอดรหัสไม่สำเร็จ");
        return;
      }
      setQrDecodeResult(data);
      await Promise.all([
        fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "payment_qr_type", value: data.type }) }),
        fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "payment_qr_account_type", value: data.accountType || "" }) }),
        fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "payment_qr_account_number", value: data.accountNumber || "" }) }),
        fetch("/api/admin/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "payment_qr_shop_name", value: data.shopName || "" }) }),
      ]);
    } catch {
      setQrDecodeError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setQrDecoding(false);
    }
  };

  const savePopup = async () => {
    setPopupSaving(true);
    try {
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "popup_image", value: popupImage }),
      });
      await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "popup_link", value: popupLink }),
      });
      setPopupSaved(true);
      setTimeout(() => setPopupSaved(false), 2000);
    } finally {
      setPopupSaving(false);
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

  const excludedKeys = [
    "site_logo", "site_og_image", "hero_banner_carousel", "hero_banner_image", "hero_banner_link",
    "knowledge_hero_image", "knowledge_hero_link", "gemcoin_icon",
    "payment_method", "payment_qr_image", "payment_qr_type", "payment_qr_account_type", "payment_qr_account_number", "payment_qr_shop_name",
    "popup_image", "popup_link",
  ];
  const displaySettings = settings.filter((s) => !excludedKeys.includes(s.key));
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

      {/* OG Image Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ImageIcon size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">รูปภาพแชร์ลิงก์ (OG Image)</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <UploadInput
            label="อัพโหลดรูปภาพ OG Image"
            value={ogImageUrl}
            onChange={setOgImageUrl}
            folder="branding"
            accept="image/png,image/jpeg,image/webp"
            placeholder="รูปภาพเวลาแชร์ลิงก์"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={saveOgImage}
              disabled={ogImageSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {ogImageSaving ? <Loader2 size={13} className="animate-spin" /> : ogImageSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {ogImageSaved ? "บันทึกแล้ว!" : "บันทึกรูปภาพ"}
            </button>
            {ogImageUrl && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ตัวอย่าง:</span>
                <img src={ogImageUrl} alt="og image preview" className="h-10 object-cover border border-slate-200 rounded p-0.5" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Banner Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon size={15} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">รูปภาพหน้าหลัก (Hero Banner - สไลด์ได้)</h2>
          </div>
          <button
            onClick={() => setHeroBanners([...heroBanners, { image: "", link: "" }])}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            <Plus size={14} /> เพิ่มรูป
          </button>
        </div>
        <div className="px-6 py-5 flex flex-col gap-6">
          {heroBanners.map((banner, index) => (
            <div key={index} className="flex flex-col gap-4 p-4 border border-slate-100 bg-slate-50 rounded-xl relative">
              {heroBanners.length > 1 && (
                <button
                  onClick={() => setHeroBanners(heroBanners.filter((_, i) => i !== index))}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-600 p-1"
                >
                  <X size={16} />
                </button>
              )}
              <UploadInput
                label={`รูปที่ ${index + 1}`}
                value={banner.image}
                onChange={(url) => {
                  const newBanners = [...heroBanners];
                  newBanners[index].image = url;
                  setHeroBanners(newBanners);
                }}
                folder="banner"
                accept="image/png,image/jpeg,image/webp"
                placeholder="อัพโหลดรูปภาพหน้าหลัก"
              />
              <div className="flex flex-col gap-1.5 -mt-1">
                <label className="text-xs font-bold text-slate-600">ลิงก์เมื่อคลิกรูปแบนเนอร์ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={banner.link}
                  onChange={(e) => {
                    const newBanners = [...heroBanners];
                    newBanners[index].link = e.target.value;
                    setHeroBanners(newBanners);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 font-medium text-slate-800"
                  placeholder="เช่น /boxes หรือ https://..."
                />
              </div>
            </div>
          ))}

          <div className="flex items-center gap-3">
            <button
              onClick={saveBannersArray}
              disabled={bannerSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {bannerSaving ? <Loader2 size={13} className="animate-spin" /> : bannerSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {bannerSaved ? "บันทึกแล้ว!" : "บันทึกรูปภาพหน้าหลัก"}
            </button>
          </div>
        </div>
      </div>

      {/* Knowledge Base Hero Banner Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ImageIcon size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">รูปภาพหน้าวิธีการเล่น (Hero Banner)</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <UploadInput
            label="อัพโหลดรูปภาพ"
            value={knowledgeBannerUrl}
            onChange={setKnowledgeBannerUrl}
            folder="banner"
            accept="image/png,image/jpeg,image/webp"
            placeholder="อัพโหลดรูปภาพหน้าวิธีการเล่น"
          />
          <div className="flex flex-col gap-1.5 -mt-1">
            <label className="text-xs font-bold text-slate-600">ลิงก์เมื่อคลิกรูปแบนเนอร์ (ไม่บังคับ)</label>
            <input
              type="text"
              value={knowledgeBannerLink}
              onChange={(e) => setKnowledgeBannerLink(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 font-medium text-slate-800"
              placeholder="เช่น /boxes หรือ https://..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={saveKnowledgeBanner}
              disabled={knowledgeBannerSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {knowledgeBannerSaving ? <Loader2 size={13} className="animate-spin" /> : knowledgeBannerSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {knowledgeBannerSaved ? "บันทึกแล้ว!" : "บันทึกรูปภาพ"}
            </button>
            {knowledgeBannerUrl && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ตัวอย่าง:</span>
                <img src={knowledgeBannerUrl} alt="knowledge banner preview" className="h-10 object-cover border border-slate-200 rounded p-0.5" />
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

      {/* Payment Method / QR Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ScanLine size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">ช่องทางรับเงิน (QR ร้านค้า)</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-600">ช่องทางที่ใช้งานอยู่</label>
            <div className="flex gap-2">
              <button
                onClick={() => savePaymentMethod("promptpay")}
                disabled={paymentMethodSaving}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors",
                  paymentMethod === "promptpay" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                พร้อมเพย์ (สร้าง QR อัตโนมัติ)
              </button>
              <button
                onClick={() => savePaymentMethod("qr_image")}
                disabled={paymentMethodSaving}
                className={cn(
                  "flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors",
                  paymentMethod === "qr_image" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                )}
              >
                QR ที่อัพโหลด
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              ใช้ตัดสินว่าหน้าเติมเงินจะแสดง QR แบบไหน และใช้เช็คบัญชีผู้รับตอนตรวจสลิป
            </p>
          </div>

          <UploadInput
            label="รูปภาพ QR Code ร้านค้า"
            value={paymentQrImage}
            onChange={(url) => { setPaymentQrImage(url); setQrDecodeResult(null); }}
            folder="qrcode"
            accept="image/png,image/jpeg,image/webp"
            placeholder="อัพโหลด QR เช่น QR ถุงเงิน"
          />

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={saveQrImage}
              disabled={qrImageSaving}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {qrImageSaving ? <Loader2 size={13} className="animate-spin" /> : qrImageSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {qrImageSaved ? "บันทึกแล้ว!" : "บันทึกรูป QR"}
            </button>
            <button
              onClick={decodeQr}
              disabled={qrDecoding || !paymentQrImage}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {qrDecoding ? <Loader2 size={13} className="animate-spin" /> : <ScanLine size={13} />}
              {qrDecoding ? "กำลังถอดรหัส..." : "ถอดรหัส QR"}
            </button>
          </div>

          {qrDecodeError && <p className="text-xs text-red-500 font-medium">{qrDecodeError}</p>}

          {qrDecodeResult && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-700 flex flex-col gap-1">
              <p className="font-bold flex items-center gap-1.5"><CheckCircle2 size={13} /> ผลถอดรหัส (ใช้เช็คบัญชีผู้รับตอนตรวจสลิป)</p>
              <p>ประเภท: {qrDecodeResult.type === "billpayment" ? "Thai QR Bill Payment (เช่น ถุงเงิน)" : "พร้อมเพย์"}</p>
              {qrDecodeResult.shopName && <p>ชื่อร้านค้า: {qrDecodeResult.shopName}</p>}
              <p>เลขอ้างอิงบัญชีผู้รับ: {qrDecodeResult.accountNumber}</p>
            </div>
          )}
        </div>
      </div>

      {/* Popup Upload Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <ImageIcon size={15} className="text-slate-400" />
          <h2 className="text-sm font-bold text-slate-700">Popup หน้าแรก</h2>
        </div>
        <div className="px-6 py-5 flex flex-col gap-4">
          <UploadInput
            label="รูปภาพ Popup"
            value={popupImage}
            onChange={setPopupImage}
            folder="popup"
            accept="image/png,image/jpeg,image/webp"
            placeholder="อัพโหลดรูปภาพ popup"
          />
          <div className="flex flex-col gap-1.5 -mt-1">
            <label className="text-xs font-bold text-slate-600">ลิงก์เมื่อคลิกรูป Popup (ไม่บังคับ)</label>
            <input
              type="text"
              value={popupLink}
              onChange={(e) => setPopupLink(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-indigo-500 font-medium text-slate-800"
              placeholder="เช่น /boxes หรือ https://..."
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={savePopup}
              disabled={popupSaving}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {popupSaving ? <Loader2 size={13} className="animate-spin" /> : popupSaved ? <CheckCircle2 size={13} /> : <Save size={13} />}
              {popupSaved ? "บันทึกแล้ว!" : "บันทึกรูป Popup"}
            </button>
            {popupImage && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span>ตัวอย่าง:</span>
                <img src={popupImage} alt="popup preview" className="h-10 object-cover border border-slate-200 rounded p-0.5" />
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400">
            หมายเหตุ: ต้องเปิด &quot;เปิดใช้งาน Popup หน้าแรก&quot; ในกลุ่ม &quot;Popup หน้าแรก&quot; ด้านล่าง เพื่อให้ popup แสดงผลจริง
          </p>
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
