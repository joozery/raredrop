const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  users.forEach(u => {
    console.log(`- ${u.name} | Email: ${u.email} | Coins: ${u.coins} | ID: ${u._id} | Avatar: ${u.avatar || u.image}`);
  });
  mongoose.disconnect();
}
check();
