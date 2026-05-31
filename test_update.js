const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const devwooyou = await User.findOne({ email: "devwooyou@example.com" }); // Or whatever email they use
  const users = await User.find({});
  const u = users.find(u => u.name === "devwooyou" || u.name === "DevThunder" || u.name === "Wooyou marketing");
  
  if (u) {
    console.log("Updating user:", u.name, "ID:", u._id.toString());
    const res = await User.findByIdAndUpdate(u._id.toString(), { $inc: { coins: 10 } }, { new: true });
    console.log("Update result:", res);
  }
  
  mongoose.disconnect();
}
check();
