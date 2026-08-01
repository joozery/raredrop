const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

delete mongoose.models.Category;
const Category = mongoose.model("Category", new mongoose.Schema({
  name:        { type: String, required: true },
  slug:        { type: String, unique: true, sparse: true },
  description: String,
  image:       String,
  order:       { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true }));

const GAME_CATS = [
  { name: "ROV",       slug: "rov",       order: 100 },
  { name: "Genshin",   slug: "genshin",   order: 101 },
  { name: "PUBG",      slug: "pubg",      order: 102 },
  { name: "Free Fire", slug: "freefire",  order: 103 },
  { name: "HSR",       slug: "hsr",       order: 104 },
  { name: "Valorant",  slug: "valorant",  order: 105 },
];

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ Connected to MongoDB");

  let created = 0, updated = 0;
  for (const cat of GAME_CATS) {
    const res = await Category.findOneAndUpdate(
      { slug: cat.slug },
      { $set: { name: cat.name, order: cat.order, isActive: true } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (res.createdAt?.getTime() === res.updatedAt?.getTime()) created++;
    else updated++;
    console.log(`  → ${cat.name} (${cat.slug})`);
  }

  console.log(`\n🎉 Done! created: ${created}, updated: ${updated}`);
  await mongoose.disconnect();
}

seed().catch(e => { console.error("❌", e.message); process.exit(1); });
