"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, ChevronLeft, Paperclip, Loader2, Info, X, Headphones } from "lucide-react";
import { LoginModal } from "@/components/auth/LoginModal";

interface ChatMsg {
  _id: string;
  senderRole: "user" | "admin";
  text: string;
  imageUrl?: string;
  createdAt: string;
}

const URL_CHARS = "[A-Za-z0-9\\-._~:/?#\\[\\]@!$&'()*+,;=%]";
const URL_REGEX = new RegExp(`(https?://${URL_CHARS}+|www\\.${URL_CHARS}+)`, "gi");

function renderWithLinks(text: string) {
  return text.split("\n").map((line, lineIdx) => (
    <span key={lineIdx}>
      {lineIdx > 0 && <br />}
      {line.split(URL_REGEX).map((part, i) => {
        if (!/^(https?:\/\/|www\.)/i.test(part)) return part;
        const match = part.match(/^(.*?)([.,!?;:)"']*)$/)!;
        const url = match[1];
        const trailing = match[2];
        return (
          <span key={i}>
            <a
              href={url.toLowerCase().startsWith("www.") ? `https://${url}` : url}
              target="_blank"
              rel="noopener noreferrer"
              className="underline break-all hover:opacity-80"
            >
              {url}
            </a>
            {trailing}
          </span>
        );
      })}
    </span>
  ));
}

interface Conversation {
  _id: string;
  subject: string;
  lastMessage: string;
  lastSender: "user" | "admin";
  lastMessageAt: string;
  unreadByUser: number;
  status: "open" | "closed";
}

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function UserInitial({ name }: { name?: string }) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  return (
    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
      {letter}
    </div>
  );
}

export default function ChatPage() {
  const { data: session, status } = useSession();

  const [loginOpen, setLoginOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [activeSubject, setActiveSubject] = useState("");
  const [activeStatus, setActiveStatus] = useState<"open" | "closed">("open");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [pendingImage, setPendingImage] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [newChatText, setNewChatText] = useState("");
  const [startingChat, setStartingChat] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [caseClosedText, setCaseClosedText] = useState("เคสถูกปิดแล้ว");
  const [caseOpenText, setCaseOpenText] = useState("กำลังดำเนินการ");
  const [contactText, setContactText] = useState("ติดต่อทีมงานได้เลย");
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/user/chat", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {}
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/user/chat/${id}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setActiveSubject(data.subject || "");
        setActiveStatus(data.status || "open");
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") setLoginOpen(true);
  }, [status]);

  useEffect(() => {
    if (welcomeLoaded) return;
    fetch("/api/public-settings")
      .then((r) => r.json())
      .then((d) => {
        setWelcomeMsg(d.livechat_welcome_message || "");
        if (d.livechat_case_closed_text) setCaseClosedText(d.livechat_case_closed_text);
        if (d.livechat_case_open_text) setCaseOpenText(d.livechat_case_open_text);
        if (d.livechat_contact_text) setContactText(d.livechat_contact_text);
        setWelcomeLoaded(true);
      })
      .catch(() => setWelcomeLoaded(true));
  }, [welcomeLoaded]);

  useEffect(() => {
    if (status !== "authenticated") return;
    const c = new URLSearchParams(window.location.search).get("c");
    if (c) setActiveId(c);
  }, [status]);

  useEffect(() => {
    if (activeId || status !== "authenticated") return;
    loadConversations();
    const t = setInterval(loadConversations, 8000);
    return () => clearInterval(t);
  }, [activeId, loadConversations, status]);

  useEffect(() => {
    if (!activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  useEffect(() => {
    if (activeId && scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, activeId]);

  const openCase = (id: string) => {
    setActiveId(id);
    setMessages([]);
    setConversations((prev) => prev.map((c) => c._id === id ? { ...c, unreadByUser: 0 } : c));
  };

  const backToList = () => {
    setActiveId(null);
    setMessages([]);
    loadConversations();
  };

  const handleFileSelect = async (file: File) => {
    setUploadingImage(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/user/chat/upload", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok && data.url) setPendingImage(data.url);
    } catch {} finally {
      setUploadingImage(false);
    }
  };

  const send = async () => {
    const text = input.trim();
    const image = pendingImage;
    if ((!text && !image) || sending || !activeId || activeStatus === "closed") return;
    setSending(true);
    const optimistic: ChatMsg = { _id: `tmp-${messages.length}`, senderRole: "user", text, imageUrl: image || undefined, createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, optimistic]);
    setInput("");
    setPendingImage("");
    try {
      const res = await fetch(`/api/user/chat/${activeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, image: image || undefined }),
      });
      if (res.ok) {
        loadMessages(activeId);
      } else {
        setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
        setInput(text);
        setPendingImage(image);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id));
      setInput(text);
      setPendingImage(image);
    } finally {
      setSending(false);
    }
  };

  const startChat = async () => {
    const text = newChatText.trim();
    if (!text || startingChat) return;
    setStartingChat(true);
    try {
      const res = await fetch("/api/user/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: "สอบถามทั่วไป", text }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewChatText("");
        await loadConversations();
        setActiveId(data.conversationId);
      }
    } catch {} finally {
      setStartingChat(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-32 gap-5 px-4 text-center">
          <div className="w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
            <MessageCircle size={36} className="text-red-400" />
          </div>
          <div>
            <p className="font-bold text-lg text-gray-800">กรุณาเข้าสู่ระบบ</p>
            <p className="text-sm text-gray-400 mt-1">เข้าสู่ระบบเพื่อพูดคุยกับทีมงาน</p>
          </div>
          <button
            onClick={() => setLoginOpen(true)}
            className="bg-red-600 text-white font-bold px-8 py-3 rounded-2xl hover:bg-red-700 transition-colors text-sm shadow-lg shadow-red-600/20"
          >
            เข้าสู่ระบบ
          </button>
        </div>
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      </>
    );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col md:my-6 md:rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white" style={{ height: "calc(100vh - 140px)", minHeight: 480 }}>

      {/* ── Header ── */}
      <div className="shrink-0 bg-gradient-to-r from-red-600 to-red-500 px-4 py-3 flex items-center gap-3">
        {activeId && (
          <button onClick={backToList} className="p-1.5 -ml-1 rounded-xl hover:bg-white/20 transition-colors shrink-0">
            <ChevronLeft size={20} className="text-white" />
          </button>
        )}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Headphones size={20} className="text-white" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-red-600 rounded-full" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-white text-sm leading-tight truncate">
            {activeId ? (activeSubject || "แชทกับทีมงาน") : "ศูนย์ช่วยเหลือ"}
          </h1>
          <p className="text-xs text-red-100 mt-0.5">
            {activeId
              ? (activeStatus === "closed" ? caseClosedText : caseOpenText)
              : contactText}
          </p>
        </div>
      </div>

      {/* ── Body ── */}
      {!activeId ? (
        <>
          <div className="flex-1 overflow-y-auto bg-gray-50/50">
            {conversations.length === 0 ? (
              <div className="flex flex-col h-full">
                {/* Welcome area */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30">
                    <Headphones size={28} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-800">ทีมงานพร้อมช่วยเหลือ</p>
                    <p className="text-xs text-gray-400 mt-1">ส่งข้อความมาได้เลยครับ</p>
                  </div>

                  {welcomeMsg ? (
                    <div className="w-full max-w-sm">
                      <div className="flex items-end gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shrink-0 shadow-sm">
                          <Headphones size={14} className="text-white" />
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm max-w-[85%]">
                          <p className="text-sm text-gray-700 leading-relaxed font-medium">
                            {renderWithLinks(welcomeMsg)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {conversations.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => openCase(c._id)}
                    className="w-full text-left px-4 py-3.5 hover:bg-white transition-colors flex items-center gap-3 group"
                  >
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                        <MessageCircle size={18} className="text-red-500" />
                      </div>
                      {c.unreadByUser > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
                          {c.unreadByUser > 9 ? "9+" : c.unreadByUser}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={`text-sm font-bold truncate ${c.unreadByUser > 0 ? "text-gray-900" : "text-gray-700"}`}>
                          {c.subject}
                        </span>
                        <span className="text-[11px] text-gray-400 shrink-0">{fmtTime(c.lastMessageAt)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className={`text-xs truncate flex-1 ${c.unreadByUser > 0 ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                          {c.lastSender === "admin" && <span className="text-red-500 font-semibold">ทีมงาน: </span>}
                          {c.lastMessage || "—"}
                        </p>
                        {c.status === "closed" && (
                          <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full shrink-0">ปิดแล้ว</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New chat input */}
          {conversations.length === 0 && (
            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 flex items-end gap-2">
              <textarea
                value={newChatText}
                onChange={(e) => {
                  setNewChatText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    setTimeout(() => {
                      startChat();
                      if (e.target) (e.target as any).style.height = "auto";
                    }, 0);
                  }
                }}
                placeholder="พิมพ์ข้อความเพื่อเริ่มแชท..."
                rows={1}
                className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 text-gray-800 resize-none min-h-[44px] max-h-[120px] leading-relaxed"
              />
              <button
                onClick={startChat}
                disabled={startingChat || !newChatText.trim()}
                className="w-11 h-11 rounded-2xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shrink-0 shadow-sm shadow-red-500/20"
              >
                {startingChat ? <Loader2 size={18} className="animate-spin" /> : <Send size={17} />}
              </button>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-2 bg-gray-50/50">
            {messages.map((m, idx) => {
              const isUser = m.senderRole === "user";
              const prevSame = idx > 0 && messages[idx - 1].senderRole === m.senderRole;
              return (
                <div key={m._id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} ${prevSame ? "mt-0.5" : "mt-2"}`}>
                  {!isUser && (
                    <div className={`shrink-0 ${prevSame ? "opacity-0 pointer-events-none" : ""}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-sm">
                        <Headphones size={12} className="text-white" />
                      </div>
                    </div>
                  )}
                  <div className={`max-w-[78%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm break-words whitespace-pre-wrap shadow-sm ${
                      isUser
                        ? "bg-red-600 text-white rounded-br-sm"
                        : "bg-white text-gray-800 border border-gray-100 rounded-bl-sm"
                    }`}>
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt="" className="max-w-[200px] h-auto rounded-xl mb-2 block" />
                      )}
                      {renderWithLinks(m.text)}
                    </div>
                    <span className="text-[10px] text-gray-400 px-1">{fmtTime(m.createdAt)}</span>
                  </div>
                  {isUser && (
                    <div className={`shrink-0 ${prevSame ? "opacity-0 pointer-events-none" : ""}`}>
                      <UserInitial name={session?.user?.name || undefined} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input area */}
          {activeStatus === "closed" ? (
            <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 flex items-center gap-2 text-gray-500 text-sm">
                <Info size={15} className="shrink-0 text-gray-400" />
                <span>{caseClosedText} — หากต้องการสอบถามเพิ่มเติม กรุณาเปิดเคสใหม่</span>
              </div>
            </div>
          ) : (
            <div className="shrink-0 border-t border-gray-100 bg-white">
              {pendingImage && (
                <div className="px-4 pt-3 flex items-center gap-2">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                    <img src={pendingImage} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => setPendingImage("")}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </div>
                  <span className="text-xs text-gray-400">รูปภาพแนบ</span>
                </div>
              )}
              <div className="px-4 py-3 flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 text-gray-400 flex items-center justify-center hover:bg-gray-100 hover:text-gray-600 transition-colors shrink-0 disabled:opacity-50"
                >
                  {uploadingImage ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
                </button>
                <textarea
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      setTimeout(() => {
                        send();
                        if (e.target) (e.target as any).style.height = "auto";
                      }, 0);
                    }
                  }}
                  placeholder="พิมพ์ข้อความ..."
                  rows={1}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400/10 text-gray-800 resize-none min-h-[44px] max-h-[120px] leading-relaxed"
                />
                <button
                  onClick={send}
                  disabled={sending || (!input.trim() && !pendingImage)}
                  className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 transition-all shrink-0 shadow-sm shadow-red-500/20"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
