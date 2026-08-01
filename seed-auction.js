const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// ========== Schemas ==========
const AuctionSchema = new mongoose.Schema({
  title:        { type: String, required: true },
  gameImage:    { type: String, required: true },
  accountLevel: { type: Number, default: 1 },
  description:  { type: String, default: "" },
  highlights:   [{ type: String }],
  tag:          { type: String, default: "" },
  tagColor:     { type: String, default: "#6b7280" },
  server:       { type: String, default: "TH" },
  startBid:     { type: Number, required: true },
  currentBid:   { type: Number, default: 0 },
  minBidStep:   { type: Number, default: 100 },
  endsAt:       { type: Date, required: true },
  status:       { type: String, enum: ["active", "ended", "cancelled"], default: "active" },
  isHot:        { type: Boolean, default: false },
  verified:     { type: Boolean, default: true },
  topBidder:    { type: String },
  totalBids:    { type: Number, default: 0 },
}, { timestamps: true });

const AuctionBidSchema = new mongoose.Schema({
  auctionId:   { type: mongoose.Schema.Types.ObjectId, ref: "Auction", required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  displayName: { type: String, required: true },
  amount:      { type: Number, required: true },
}, { timestamps: true });

const Auction    = mongoose.models.Auction    || mongoose.model("Auction",    AuctionSchema);
const AuctionBid = mongoose.models.AuctionBid || mongoose.model("AuctionBid", AuctionBidSchema);

// ========== Helper ==========
const h  = (hours)   => new Date(Date.now() + hours * 3_600_000);
const IMG = "https://pub-ee29977ae9524b05b628923eee00188a.r2.dev/logo/logo.png";

// ========== Auction Data ==========
const AUCTIONS = [
  // --- กำลังประมูล + ด่วน (< 1 ชั่วโมง) ---
  {
    title: "ROV Account Lv.50 Conqueror ★5",
    gameImage: IMG,
    accountLevel: 50,
    description: "ไอดี ROV แรงค์ Conqueror ดาวสูง สกิน Eternal + สกิน Limited หายากครบชุด กว่า 140+ สกิน มี Arcana ครบ เล่นได้ทุก Role",
    highlights: ["Conqueror ★5", "140+ Skins", "Full Arcana Set", "เซิร์ฟ TH"],
    tag: "ROV", tagColor: "#ef4444", server: "TH",
    startBid: 8000, currentBid: 12500, minBidStep: 500,
    endsAt: h(0.3),   // 18 นาที
    isHot: true, verified: true, totalBids: 28, topBidder: "user***999",
    status: "active",
  },
  {
    title: "Free Fire Elite Pass S1–S5 OG Account",
    gameImage: IMG,
    accountLevel: 74,
    description: "ไอดี Free Fire รุ่นเก่า Pass ซีซั่นแรกๆ ครบ สกินปืนถาวร 50+ กระบอก ซองยาวในตำนาน ไม่เคยขาย",
    highlights: ["Pass S1–S5", "50+ Gun Skins", "Rare Emotes", "OG Account"],
    tag: "Free Fire", tagColor: "#10b981", server: "TH",
    startBid: 4000, currentBid: 7200, minBidStep: 400,
    endsAt: h(0.7),   // 42 นาที
    isHot: true, verified: true, totalBids: 19, topBidder: "ff***pro99",
    status: "active",
  },

  // --- กำลังประมูล (2–12 ชั่วโมง) ---
  {
    title: "Genshin Impact AR58 — Raiden C2 + Nahida",
    gameImage: IMG,
    accountLevel: 58,
    description: "ไอดี Genshin Impact เล่นถึง AR58 มีตัวละคร 5 ดาว 14 ตัว Raiden Shogun C2 + Signature Weapon, Nahida, Kazuha อาวุธประจำตัวแน่นๆ",
    highlights: ["14× 5-Star Chars", "Raiden C2+Sig", "Nahida + Kazuha", "150+ Primogems"],
    tag: "Genshin", tagColor: "#8b5cf6", server: "Asia",
    startBid: 5000, currentBid: 8900, minBidStep: 300,
    endsAt: h(2.7),
    isHot: true, verified: true, totalBids: 14, topBidder: "gamer***888",
    status: "active",
  },
  {
    title: "PUBG Mobile Diamond — M416 Glacier Lv.5",
    gameImage: IMG,
    accountLevel: 82,
    description: "แรงค์ Diamond มีชุด Royal Pass Season 2–10 หายาก M416 Glacier Lv.5 อัปเกรดเรียบร้อย Outfit ครบ",
    highlights: ["M4 Glacier Lv.5", "Season 2–10 Pass", "Diamond Rank", "Old Outfit"],
    tag: "PUBG", tagColor: "#f59e0b", server: "TH",
    startBid: 2500, currentBid: 4500, minBidStep: 200,
    endsAt: h(5.2),
    isHot: false, verified: true, totalBids: 9, topBidder: "pubg***master",
    status: "active",
  },
  {
    title: "Valorant Immortal 3 — Vandal Prime + Karambit Champions 2021",
    gameImage: IMG,
    accountLevel: 145,
    description: "แรงค์ Immortal ซีซั่น Peak มี Vandal Prime, Karambit Champions 2021, Kuronami Bundle ครบชุด Agent ครบทุกตัว",
    highlights: ["Immortal 3 Peak", "Champions 2021", "All Agents Unlocked", "Vandal Prime"],
    tag: "Valorant", tagColor: "#dc2626", server: "SEA",
    startBid: 3000, currentBid: 5400, minBidStep: 200,
    endsAt: h(8.3),
    isHot: false, verified: true, totalBids: 12, topBidder: "val***headshot",
    status: "active",
  },
  {
    title: "Honkai: Star Rail TL70 — Acheron E2S1 + MoC 12 Auto",
    gameImage: IMG,
    accountLevel: 70,
    description: "ไอดีสายลุย Acheron E2S1 + Jingliu, Ruan Mei, Sparkle จบทุก Content Memory of Chaos 12 สบาย มี Warp Stock เหลืออีก 150+",
    highlights: ["Acheron E2S1", "MoC 12 Auto-Clear", "150+ Warps Stock", "Asia Server"],
    tag: "HSR", tagColor: "#6366f1", server: "Asia",
    startBid: 8000, currentBid: 16500, minBidStep: 1000,
    endsAt: h(36),
    isHot: true, verified: true, totalBids: 35, topBidder: "hsr***star",
    status: "active",
  },

  // --- รายการใหม่ ยังไม่มีคนประมูล ---
  {
    title: "Mobile Legends Mythical Glory — Full Skin S1",
    gameImage: IMG,
    accountLevel: 300,
    description: "ไอดี MLBB แรงค์ Mythical Glory มีสกิน Collector + Epic ครบทุก Hero สกิน Season 1 หายากมากๆ ไม่ผ่านมือสาม",
    highlights: ["Mythical Glory", "Season 1 Skins", "Collector Skins", "300+ Heroes"],
    tag: "MLBB", tagColor: "#0ea5e9", server: "TH",
    startBid: 6000, currentBid: 6000, minBidStep: 300,
    endsAt: h(48),
    isHot: false, verified: true, totalBids: 0, topBidder: null,
    status: "active",
  },
  {
    title: "Arena of Valor — Ryoma Eternal Legacy + 200 Skins",
    gameImage: IMG,
    accountLevel: 62,
    description: "ไอดี ROV เซิร์ฟสากล มีสกิน Ryoma Eternal ที่ไม่มีขายแล้ว + สกิน Limited 200+ ชิ้น แรงค์ Conqueror ดาวสูง",
    highlights: ["Ryoma Eternal", "200+ Skins", "Global Server", "Conqueror Rank"],
    tag: "ROV", tagColor: "#ef4444", server: "Global",
    startBid: 15000, currentBid: 15000, minBidStep: 500,
    endsAt: h(72),
    isHot: true, verified: true, totalBids: 0, topBidder: null,
    status: "active",
  },

  // --- สิ้นสุดแล้ว ---
  {
    title: "Genshin Impact AR55 — Hu Tao C1 + Yelan",
    gameImage: IMG,
    accountLevel: 55,
    description: "ไอดีเก่าเล่นมานาน Hu Tao C1 + Signature, Yelan, Xiao มีทุ่งหิมะ Dragonspine ครบ",
    highlights: ["Hu Tao C1+Sig", "Yelan + Xiao", "AR55 Cleared", "Asia Server"],
    tag: "Genshin", tagColor: "#8b5cf6", server: "Asia",
    startBid: 4000, currentBid: 9800, minBidStep: 300,
    endsAt: h(-3),   // จบไปแล้ว 3 ชั่วโมง
    isHot: false, verified: true, totalBids: 22, topBidder: "wish***god",
    status: "ended",
  },
  {
    title: "PUBG Mobile Conqueror Season 1 — Full Legacy",
    gameImage: IMG,
    accountLevel: 95,
    description: "ไอดีซีซั่น 1 Conqueror ของจริง มี outfit โบราณหายากมาก ไม่มีอีกแล้ว M24 Gold เปิดมาพร้อมบัญชี",
    highlights: ["Season 1 Conqueror", "M24 Gold", "Legacy Outfits", "ของหายาก"],
    tag: "PUBG", tagColor: "#f59e0b", server: "TH",
    startBid: 5000, currentBid: 11200, minBidStep: 500,
    endsAt: h(-1),
    isHot: false, verified: true, totalBids: 17, topBidder: "og***pubg",
    status: "ended",
  },
];

// ========== Mock Bids per Auction (index-based) ==========
const MOCK_BIDS = [
  // ROV (index 0) — 28 bids
  [
    { name: "user***999", amount: 12500 }, { name: "gamer***777", amount: 12000 },
    { name: "rov***king", amount: 11500 }, { name: "pro***gg",    amount: 11000 },
    { name: "dark***x",   amount: 10500 }, { name: "lucky***99",  amount: 10000 },
  ],
  // Free Fire (index 1) — 19 bids
  [
    { name: "ff***pro99",    amount: 7200 }, { name: "booyah***king", amount: 6800 },
    { name: "headshot***z",  amount: 6400 }, { name: "rush_b***th",   amount: 6000 },
    { name: "elite***s1",    amount: 5600 },
  ],
  // Genshin (index 2) — 14 bids
  [
    { name: "gamer***888", amount: 8900 }, { name: "wish***god",  amount: 8600 },
    { name: "paimon***xx", amount: 8300 }, { name: "traveler_99", amount: 8000 },
    { name: "mora***rich", amount: 7700 },
  ],
  // PUBG (index 3) — 9 bids
  [
    { name: "pubg***master", amount: 4500 }, { name: "squad***win", amount: 4300 },
    { name: "sniper***xx",   amount: 4100 },
  ],
  // Valorant (index 4) — 12 bids
  [
    { name: "val***headshot", amount: 5400 }, { name: "radiant***pro", amount: 5200 },
    { name: "aim_god_101",    amount: 5000 }, { name: "eco***round",   amount: 4800 },
  ],
  // HSR (index 5) — 35 bids
  [
    { name: "hsr***star",    amount: 16500 }, { name: "acheron***e2",  amount: 15500 },
    { name: "moc12***clear", amount: 14500 }, { name: "ruan***mei99",  amount: 13500 },
    { name: "warp***god",    amount: 12500 }, { name: "trailblaze",    amount: 11500 },
    { name: "jingliu***xx",  amount: 10500 }, { name: "sparkle***s1",  amount: 9500  },
  ],
  // MLBB — 0 bids
  [],
  // ROV Global — 0 bids
  [],
  // Genshin ended — 22 bids
  [
    { name: "wish***god",   amount: 9800 }, { name: "hutao***c1",  amount: 9500 },
    { name: "yelan***main", amount: 9200 }, { name: "xiao***carry",amount: 8900 },
    { name: "genshin_fan",  amount: 8600 },
  ],
  // PUBG ended — 17 bids
  [
    { name: "og***pubg",    amount: 11200 }, { name: "season1***th", amount: 10700 },
    { name: "legacy***gun", amount: 10200 }, { name: "old***school",  amount: 9700  },
  ],
];

// ========== Seed Function ==========
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  // ลบ auction เก่าทั้งหมด
  const deletedAuctions = await Auction.deleteMany({});
  const deletedBids     = await AuctionBid.deleteMany({});
  console.log(`🗑️  Cleared ${deletedAuctions.deletedCount} auctions, ${deletedBids.deletedCount} bids`);

  // สร้าง auction
  const created = await Auction.insertMany(AUCTIONS);
  console.log(`✅ Created ${created.length} auctions`);

  // สร้าง bids (ใช้ dummy userId)
  const dummyUserId = new mongoose.Types.ObjectId();
  const allBids = [];

  for (let i = 0; i < created.length; i++) {
    const auction = created[i];
    const bids    = MOCK_BIDS[i] || [];

    // สร้าง bids จากมากไปน้อย (เรียงตาม createdAt)
    for (let j = bids.length - 1; j >= 0; j--) {
      allBids.push({
        auctionId:   auction._id,
        userId:      dummyUserId,
        displayName: bids[j].name,
        amount:      bids[j].amount,
        createdAt:   new Date(Date.now() - (bids.length - j) * 5 * 60_000), // ห่างกัน 5 นาที
      });
    }
  }

  if (allBids.length > 0) {
    await AuctionBid.insertMany(allBids);
    console.log(`✅ Created ${allBids.length} bids`);
  }

  // สรุป
  console.log("\n🎉 Auction seed complete!");
  console.log("─────────────────────────────────────");

  const statusGroups = {};
  for (const a of created) {
    const key = a.status;
    statusGroups[key] = (statusGroups[key] || 0) + 1;
  }

  for (const [status, count] of Object.entries(statusGroups)) {
    const label =
      status === "active"    ? "🟢 กำลังประมูล" :
      status === "ended"     ? "⚫ สิ้นสุดแล้ว"  :
                               "🟡 ยกเลิก";
    console.log(`   ${label}  : ${count} รายการ`);
  }

  console.log(`   Bids total : ${allBids.length} รายการ`);
  console.log("─────────────────────────────────────");
  console.log("\nรัน dev server แล้วไปที่ /auction เพื่อดูผล\n");

  await mongoose.disconnect();
}

seed().catch((e) => { console.error("❌", e.message); process.exit(1); });
