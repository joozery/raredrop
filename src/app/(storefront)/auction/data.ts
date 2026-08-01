export interface AuctionItem {
  id: string;
  gameName: string;
  gameImage: string;
  accountLevel: number;
  description: string;
  currentBid: number;
  minBidStep: number;
  endsAt: Date;
  totalBids: number;
  topBidder: string | null;
  isHot: boolean;
  tag: string;
  tagColor: string;
  server?: string;
  verified?: boolean;
  highlights?: string[];
}

export interface BidRecord {
  user: string;
  amount: number;
  time: string;
  isTop?: boolean;
}

export const MOCK_AUCTIONS: AuctionItem[] = [
  {
    id: "1",
    gameName: "ROV Account Lv.50 Conqueror",
    gameImage: "/product/pokemon.webp",
    accountLevel: 50,
    description: "ไอดี ROV แรงค์ Conqueror ดาวสูง สกิน Eternal + สกิน Limited หายากครบชุด กว่า 140+ สกิน",
    currentBid: 12500,
    minBidStep: 500,
    endsAt: new Date(Date.now() + 1000 * 60 * 14 + 1000 * 32),
    totalBids: 28,
    topBidder: "user***999",
    isHot: true,
    tag: "ROV",
    tagColor: "#ef4444",
    server: "TH",
    verified: true,
    highlights: ["Conqueror Rank", "140+ Skins", "Full Arcana"],
  },
  {
    id: "2",
    gameName: "Genshin Impact AR58 End Game",
    gameImage: "/product/pokemon.webp",
    accountLevel: 58,
    description: "มีตัวละคร 5 ดาว 14 ตัว (Raiden C2 + Signature, Nahida, Kazuha) อาวุธประจำตัวแน่นๆ",
    currentBid: 8900,
    minBidStep: 300,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 2 + 1000 * 60 * 45),
    totalBids: 14,
    topBidder: "gamer***888",
    isHot: true,
    tag: "Genshin",
    tagColor: "#8b5cf6",
    server: "Asia",
    verified: true,
    highlights: ["14x 5-Stars", "Raiden C2", "Well Built"],
  },
  {
    id: "3",
    gameName: "PUBG Mobile Diamond S2 Pass",
    gameImage: "/product/pokemon.webp",
    accountLevel: 82,
    description: "ระดับ Diamond มีชุด Royal Pass Season 2-10 หายาก M416 Glacier Lv.5 อัปเกรดเรียบร้อย",
    currentBid: 4500,
    minBidStep: 200,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 5 + 1000 * 60 * 10),
    totalBids: 9,
    topBidder: "pubg***master",
    isHot: false,
    tag: "PUBG",
    tagColor: "#f59e0b",
    server: "TH",
    verified: true,
    highlights: ["M4 Glacier Lv.5", "S2 Outfit", "Old Pass"],
  },
  {
    id: "4",
    gameName: "Free Fire ID Elite Pass S1-S5",
    gameImage: "/product/pokemon.webp",
    accountLevel: 74,
    description: "ไอดี FF ในตำนาน Pass ซีซั่นแรกๆ ครบ สกินปืนถาวร 50+ กระบอก ซองยาวในตำนาน",
    currentBid: 7200,
    minBidStep: 400,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 18),
    totalBids: 19,
    topBidder: "ff***pro99",
    isHot: true,
    tag: "Free Fire",
    tagColor: "#10b981",
    server: "TH",
    verified: true,
    highlights: ["Pass S1-S5", "50+ Gun Skins", "Rare Emotes"],
  },
  {
    id: "5",
    gameName: "Honkai Star Rail TL70 Top Tier",
    gameImage: "/product/pokemon.webp",
    accountLevel: 70,
    description: "ไอดีสายลุย Acheron E2S1, Jingliu, Ruan Mei, Sparkle จบทุกคอนเทนต์ MoC 12 สบาย",
    currentBid: 16500,
    minBidStep: 1000,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 36),
    totalBids: 35,
    topBidder: "hsr***star",
    isHot: true,
    tag: "HSR",
    tagColor: "#6366f1",
    server: "Asia",
    verified: true,
    highlights: ["Acheron E2S1", "MoC 12 Auto", "150+ Warps"],
  },
  {
    id: "6",
    gameName: "Valorant Immortal 3 Peak",
    gameImage: "/product/pokemon.webp",
    accountLevel: 145,
    description: "แรงค์ Immortal มี Vandal Prime, Karambit Champions 2021, Kuronami Bundle ครบชุด",
    currentBid: 5400,
    minBidStep: 200,
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 8 + 1000 * 60 * 20),
    totalBids: 12,
    topBidder: "val***headshot",
    isHot: false,
    tag: "Valorant",
    tagColor: "#dc2626",
    server: "SEA",
    verified: true,
    highlights: ["Immortal Peak", "Champions 2021", "All Agents"],
  },
];

export const MOCK_BID_HISTORY: Record<string, BidRecord[]> = {
  "1": [
    { user: "user***999", amount: 12500, time: "เมื่อสักครู่", isTop: true },
    { user: "gamer***777", amount: 12000, time: "3 นาทีที่แล้ว" },
    { user: "rov***king",  amount: 11500, time: "7 นาทีที่แล้ว" },
    { user: "pro***gg",    amount: 11000, time: "12 นาทีที่แล้ว" },
    { user: "dark***x",    amount: 10500, time: "18 นาทีที่แล้ว" },
    { user: "lucky***99",  amount: 10000, time: "25 นาทีที่แล้ว" },
    { user: "player***01", amount: 9500,  time: "31 นาทีที่แล้ว" },
  ],
  "2": [
    { user: "gamer***888", amount: 8900, time: "เมื่อสักครู่", isTop: true },
    { user: "wish***god",  amount: 8600, time: "10 นาทีที่แล้ว" },
    { user: "paimon***xx", amount: 8300, time: "22 นาทีที่แล้ว" },
    { user: "traveler_99", amount: 8000, time: "35 นาทีที่แล้ว" },
    { user: "mora***rich",  amount: 7700, time: "48 นาทีที่แล้ว" },
  ],
  "3": [
    { user: "pubg***master", amount: 4500, time: "เมื่อสักครู่", isTop: true },
    { user: "squad***win",   amount: 4300, time: "15 นาทีที่แล้ว" },
    { user: "sniper***xx",   amount: 4100, time: "30 นาทีที่แล้ว" },
  ],
  "4": [
    { user: "ff***pro99",   amount: 7200, time: "เมื่อสักครู่", isTop: true },
    { user: "booyah***king", amount: 6800, time: "5 นาทีที่แล้ว" },
    { user: "headshot***z",  amount: 6400, time: "20 นาทีที่แล้ว" },
    { user: "rush_b***th",   amount: 6000, time: "45 นาทีที่แล้ว" },
    { user: "elite***s1",    amount: 5600, time: "1 ชั่วโมงที่แล้ว" },
    { user: "ff***legend",   amount: 5200, time: "1.5 ชั่วโมงที่แล้ว" },
  ],
  "5": [
    { user: "hsr***star",    amount: 16500, time: "เมื่อสักครู่", isTop: true },
    { user: "acheron***e2",  amount: 15500, time: "8 นาทีที่แล้ว" },
    { user: "moc12***clear", amount: 14500, time: "20 นาทีที่แล้ว" },
    { user: "ruan***mei99",  amount: 13500, time: "35 นาทีที่แล้ว" },
    { user: "warp***god",    amount: 12500, time: "50 นาทีที่แล้ว" },
    { user: "trailblaze",    amount: 11500, time: "1 ชั่วโมงที่แล้ว" },
    { user: "jingliu***xx",  amount: 10500, time: "1.5 ชั่วโมงที่แล้ว" },
    { user: "sparkle***s1",  amount: 9500,  time: "2 ชั่วโมงที่แล้ว" },
  ],
  "6": [
    { user: "val***headshot", amount: 5400, time: "เมื่อสักครู่", isTop: true },
    { user: "radiant***pro",  amount: 5200, time: "20 นาทีที่แล้ว" },
    { user: "aim_god_101",    amount: 5000, time: "45 นาทีที่แล้ว" },
    { user: "eco***round",    amount: 4800, time: "1 ชั่วโมงที่แล้ว" },
  ],
};
