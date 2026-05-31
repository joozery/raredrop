const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

const userSchema = new mongoose.Schema({}, { strict: false });
const User = mongoose.model("User", userSchema, "users");

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.findByIdAndUpdate("6a1c67f85e763384434dca39", { $inc: { coins: 10 } }); // DevThunder
  mongoose.disconnect();
}
check();
