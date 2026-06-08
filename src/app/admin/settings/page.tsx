"use client";

import { useState, useEffect } from "react";
import { Settings, Save, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingItem {
  _id: string;
  key: string;
  value: string | number | boolean;
  label: string;
  description?: string;
  type: "text" | "boolean" | "number" | "select";
  group: string;
  options?: string[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingItem[]>([]);
  const [pending, setPending] = useState<Record<string, string | number | boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = () => {
    setLoading(true);
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setSettings(d); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSettings(); }, []);

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
      if (res.ok) {
        const updated = await res.json();
        setSettings((prev) =>
          prev.map((item) => (item.key === s.key ? { ...item, value: updated.value } : item))
        );
        setPending((p) => { const n = { ...p }; delete n[s.key]; return n; });
        setSaved((p) => ({ ...p, [s.key]: true }));
        setTimeout(() => setSaved((p) => ({ ...p, [s.key]: false })), 2000);
      }
    } finally {
      setSaving((p) => ({ ...p, [s.key]: false }));
    }
  };

  const groups = [...new Set(settings.map((s) => s.group))];

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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">ตั้งค่าระบบ</h1>
          <p className="text-sm text-slate-500 mt-1">ปรับแต่งพฤติกรรมของแพลตฟอร์ม — การเปลี่ยนแปลงมีผลทันที</p>
        </div>
        <button
          onClick={fetchSettings}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
        >
          <RefreshCw size={14} />
          รีเฟรช
        </button>
      </div>

      {groups.map((group) => (
        <div key={group} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
            <Settings size={15} className="text-slate-400" />
            <h2 className="text-sm font-bold text-slate-700">{group}</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {settings
              .filter((s) => s.group === group)
              .map((s) => {
                const currentVal = getValue(s);
                const isDirty = pending[s.key] !== undefined;
                return (
                  <div key={s.key} className="px-6 py-4 flex items-center gap-4">
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
                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
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
                          className="w-28 px-3 py-1.5 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
                        />
                      ) : (
                        <input
                          type="text"
                          value={currentVal as string}
                          onChange={(e) => handleChange(s.key, e.target.value)}
                          className="w-52 px-3 py-1.5 text-sm font-medium text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400"
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
