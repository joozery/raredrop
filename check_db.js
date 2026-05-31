const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const users = await User.find({});
  console.log("Users in DB:");
  users.forEach(u => {
    console.log(`- ${u.name || u.email} : ${u.coins} THB`);
  });
  mongoose.disconnect();
}
check();
