require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
require("../config/db");
const mongoose = require("mongoose");
const Sales = require("../models/sales");
const { generateArticleNumber } = require("../services/sales");

async function run() {
  if (mongoose.connection.readyState !== 1) {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
  }
  console.log("Connected to MongoDB. Searching for sales without articleNumber...");

  const salesWithoutArticleNo = await Sales.find({
    $or: [
      { articleNumber: { $exists: false } },
      { articleNumber: null },
      { articleNumber: "" },
    ],
  }).select("_id branch billId");

  console.log(`Found ${salesWithoutArticleNo.length} sales without articleNumber.`);

  let updatedCount = 0;
  for (const sale of salesWithoutArticleNo) {
    const articleNumber = await generateArticleNumber(sale.branch);
    await Sales.updateOne({ _id: sale._id }, { $set: { articleNumber } });
    updatedCount++;
    console.log(`Updated sale ${sale.billId || sale._id} with articleNumber: ${articleNumber}`);
  }

  console.log(`Backfill complete. Updated ${updatedCount} sales.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
