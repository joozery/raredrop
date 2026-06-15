const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

// ========== Schemas ==========
const RaritySchema = new mongoose.Schema({ name: String, color: String, order: Number }, { timestamps: true });
const CategorySchema = new mongoose.Schema({ name: String, description: String, icon: String }, { timestamps: true });
const ItemSchema = new mongoose.Schema({
  name: String, description: String, image: String,
  rarityId: mongoose.Schema.Types.ObjectId,
  categoryId: mongoose.Schema.Types.ObjectId,
  price: Number, stock: Number, isActive: Boolean,
}, { timestamps: true });
const BoxItemSchema = new mongoose.Schema({ itemId: mongoose.Schema.Types.ObjectId, probability: Number }, { _id: false });
const BoxSchema = new mongoose.Schema({
  name: String, description: String, image: String, animation: String,
  price: Number, categoryId: mongoose.Schema.Types.ObjectId,
  isFeatured: Boolean, isActive: Boolean, items: [BoxItemSchema],
}, { timestamps: true });

const Rarity = mongoose.models.Rarity || mongoose.model("Rarity", RaritySchema);
const Category = mongoose.models.Category || mongoose.model("Category", CategorySchema);
const Item = mongoose.models.Item || mongoose.model("Item", ItemSchema);
const Box = mongoose.models.Box || mongoose.model("Box", BoxSchema);

// ========== Assets ==========
const IMG = "/product/pokemon.webp";
const ANIM = "/animationbox.mp4";

// ========== Mock Data ==========
const RARITIES = [
  { name: "Common",    color: "#9CA3AF", order: 1 },
  { name: "Uncommon",  color: "#22C55E", order: 2 },
  { name: "Rare",      color: "#3B82F6", order: 3 },
  { name: "Epic",      color: "#A855F7", order: 4 },
  { name: "Legendary", color: "#F59E0B", order: 5 },
];

const CATEGORIES = [
  { name: "Anime",     icon: "🎭" },
  { name: "Pokémon",   icon: "⚡" },
  { name: "Labubu",    icon: "🐰" },
  { name: "Bearbrick", icon: "🐻" },
  { name: "Sneaker",   icon: "👟" },
  { name: "Luxury",    icon: "💎" },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  await Promise.all([Rarity.deleteMany(), Category.deleteMany(), Item.deleteMany(), Box.deleteMany()]);
  console.log("🗑️  Cleared old data");

  const rarities = await Rarity.insertMany(RARITIES);
  const r = Object.fromEntries(rarities.map(r => [r.name, r._id]));
  console.log("✅ Rarities created");

  const categories = await Category.insertMany(CATEGORIES);
  const c = Object.fromEntries(categories.map(c => [c.name, c._id]));
  console.log("✅ Categories created");

  const itemsData = [
    // Anime
    { name: "Naruto Rasengan Figure", rarityId: r.Rare,      categoryId: c.Anime,       price: 890,    stock: 50  },
    { name: "Goku Ultra Instinct",    rarityId: r.Legendary, categoryId: c.Anime,       price: 3500,   stock: 10  },
    { name: "Luffy Gear 5",           rarityId: r.Epic,      categoryId: c.Anime,       price: 1800,   stock: 20  },
    { name: "Demon Slayer Tanjiro",   rarityId: r.Uncommon,  categoryId: c.Anime,       price: 450,    stock: 100 },
    // Pokemon
    { name: "Pikachu VMAX Gold",      rarityId: r.Legendary, categoryId: c["Pokémon"],  price: 9800,   stock: 5   },
    { name: "Charizard Holo Rare",    rarityId: r.Epic,      categoryId: c["Pokémon"],  price: 4500,   stock: 15  },
    { name: "Eevee Collection",       rarityId: r.Rare,      categoryId: c["Pokémon"],  price: 1200,   stock: 30  },
    { name: "Mewtwo Secret Rare",     rarityId: r.Legendary, categoryId: c["Pokémon"],  price: 12000,  stock: 3   },
    // Labubu
    { name: "Labubu Secret Macaroon", rarityId: r.Legendary, categoryId: c.Labubu,      price: 12900,  stock: 5   },
    { name: "Labubu Classic Pink",    rarityId: r.Rare,      categoryId: c.Labubu,      price: 2800,   stock: 25  },
    { name: "Labubu Monster Series",  rarityId: r.Epic,      categoryId: c.Labubu,      price: 5500,   stock: 12  },
    { name: "Labubu Mini Common",     rarityId: r.Common,    categoryId: c.Labubu,      price: 490,    stock: 200 },
    // Bearbrick
    { name: "Bearbrick 400% KAWS",    rarityId: r.Legendary, categoryId: c.Bearbrick,   price: 18000,  stock: 3   },
    { name: "Bearbrick 100% Classic", rarityId: r.Uncommon,  categoryId: c.Bearbrick,   price: 890,    stock: 80  },
    // Sneaker
    { name: "Nike Air Jordan 1 OG",   rarityId: r.Epic,      categoryId: c.Sneaker,     price: 8500,   stock: 8   },
    { name: "Adidas Yeezy 350",       rarityId: r.Rare,      categoryId: c.Sneaker,     price: 4200,   stock: 15  },
    { name: "Nike Dunk Low Panda",    rarityId: r.Uncommon,  categoryId: c.Sneaker,     price: 2800,   stock: 30  },
    // Luxury
    { name: "Rolex Submariner (Mini)",rarityId: r.Legendary, categoryId: c.Luxury,      price: 250000, stock: 1   },
    { name: "Louis Vuitton Keychain", rarityId: r.Rare,      categoryId: c.Luxury,      price: 3200,   stock: 20  },
    { name: "Gucci Toy Bear",         rarityId: r.Epic,      categoryId: c.Luxury,      price: 9500,   stock: 5   },
  ].map(d => ({ ...d, image: IMG, isActive: true, description: "" }));

  const items = await Item.insertMany(itemsData);
  const byName = Object.fromEntries(items.map(i => [i.name, i._id]));
  console.log(`✅ ${items.length} items created`);

  function buildItems(picks) {
    return picks.map(p => ({ itemId: byName[p.name], probability: p.prob }));
  }

  const boxesData = [
    {
      name: "Anime Legends Box",
      description: "กล่องสุ่มรูปปั้นอนิเมะจากซีรีส์ดังทั่วโลก",
      image: IMG, animation: ANIM, price: 99,
      categoryId: c.Anime, isFeatured: true, isActive: true,
      items: buildItems([
        { name: "Demon Slayer Tanjiro",   prob: 50 },
        { name: "Naruto Rasengan Figure", prob: 30 },
        { name: "Luffy Gear 5",           prob: 15 },
        { name: "Goku Ultra Instinct",    prob: 5  },
      ]),
    },
    {
      name: "Pokémon Ultimate Box",
      description: "กล่องสุ่มการ์ดโปเกมอน โอกาสได้ของหายากสูง!",
      image: IMG, animation: ANIM, price: 129,
      categoryId: c["Pokémon"], isFeatured: true, isActive: true,
      items: buildItems([
        { name: "Eevee Collection",    prob: 55 },
        { name: "Charizard Holo Rare", prob: 25 },
        { name: "Pikachu VMAX Gold",   prob: 12 },
        { name: "Mewtwo Secret Rare",  prob: 8  },
      ]),
    },
    {
      name: "Labubu Secret Box",
      description: "กล่องพิเศษ Labubu จาก Pop Mart ลิมิเต็ดเอดิชัน",
      image: IMG, animation: ANIM, price: 199,
      categoryId: c.Labubu, isFeatured: true, isActive: true,
      items: buildItems([
        { name: "Labubu Mini Common",     prob: 50 },
        { name: "Labubu Classic Pink",    prob: 30 },
        { name: "Labubu Monster Series",  prob: 15 },
        { name: "Labubu Secret Macaroon", prob: 5  },
      ]),
    },
    {
      name: "Bearbrick Mystery Box",
      description: "กล่องสุ่ม Bearbrick ครบทุกขนาด",
      image: IMG, animation: ANIM, price: 149,
      categoryId: c.Bearbrick, isFeatured: false, isActive: true,
      items: buildItems([
        { name: "Bearbrick 100% Classic", prob: 70 },
        { name: "Bearbrick 400% KAWS",    prob: 30 },
      ]),
    },
    {
      name: "Sneaker Mystery Box",
      description: "สุ่มรองเท้าลิมิเต็ด Nike / Adidas",
      image: IMG, animation: ANIM, price: 299,
      categoryId: c.Sneaker, isFeatured: true, isActive: true,
      items: buildItems([
        { name: "Nike Dunk Low Panda",  prob: 55 },
        { name: "Adidas Yeezy 350",     prob: 30 },
        { name: "Nike Air Jordan 1 OG", prob: 15 },
      ]),
    },
    {
      name: "Luxury Secret Box",
      description: "โอกาสรับของแบรนด์หรูในราคาที่คุณไม่คาดฝัน",
      image: IMG, animation: ANIM, price: 499,
      categoryId: c.Luxury, isFeatured: false, isActive: true,
      items: buildItems([
        { name: "Louis Vuitton Keychain",  prob: 60 },
        { name: "Gucci Toy Bear",          prob: 30 },
        { name: "Rolex Submariner (Mini)", prob: 10 },
      ]),
    },
  ];

  await Box.insertMany(boxesData);
  console.log(`✅ ${boxesData.length} boxes created`);

  console.log("\n🎉 Seed complete!");
  console.log(`   Rarities  : ${rarities.length}`);
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Items     : ${items.length}`);
  console.log(`   Boxes     : ${boxesData.length}`);
  console.log(`   Image     : ${IMG}`);
  console.log(`   Animation : ${ANIM}`);

  await mongoose.disconnect();
}

seed().catch((e) => { console.error(e); process.exit(1); });
