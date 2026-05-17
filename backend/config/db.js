const mongoose = require("mongoose");

mongoose.set('strictQuery', false);

mongoose.connection.once("open", async () => {
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections({ name: "qr_enquiries" }).toArray();
    if (collections.length > 0) {
      const indexes = await db.collection("qr_enquiries").indexes();
      const hasIndex = indexes.some(idx => idx.name === "mkgCustomerId_1");
      if (hasIndex) {
        await db.collection("qr_enquiries").dropIndex("mkgCustomerId_1");
        console.log("Successfully dropped duplicate-blocking unique index mkgCustomerId_1 from qr_enquiries");
      }
    }
  } catch (err) {
    console.error("Error checking/dropping index mkgCustomerId_1:", err);
  }
});

mongoose.connect(process.env.DB_HOST, function (err) {
  if (err) {
    console.log(err.message);
  } else {
    console.log("Connected to MongoDB");
  }
});
