const mongoose = require('mongoose');

const MONGODB_URI = "mongodb+srv://devwooyou:joozery1234@cluster1.7xi2oge.mongodb.net/raredrop?retryWrites=true&w=majority&appName=Cluster1";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const boxes = await mongoose.connection.db.collection('boxes').find({}).toArray();
  console.log("Boxes count:", boxes.length);
  for (let b of boxes) {
    if (b.titleImage) {
      console.log(`Box ${b._id} has titleImage: ${b.titleImage}`);
    } else {
      console.log(`Box ${b._id} has NO titleImage`);
    }
  }
  process.exit(0);
}

check();
