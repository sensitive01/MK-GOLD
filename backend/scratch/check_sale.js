const mongoose = require('mongoose');
const DB_HOST = "mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold";

mongoose.connect(DB_HOST).then(async () => {
  const Sales = mongoose.model('sales', new mongoose.Schema({}, { strict: false }));
  const Release = mongoose.model('releases', new mongoose.Schema({}, { strict: false }));

  const sale = await Sales.findOne({ billId: "227414" }).lean();
  console.log("=== SALE ===");
  console.log(JSON.stringify(sale, null, 2));

  if (sale && sale.release) {
    console.log("=== LINKED RELEASES ===");
    for (const relId of sale.release) {
      const releaseDoc = await Release.findById(relId).lean();
      console.log(JSON.stringify(releaseDoc, null, 2));
    }
  }

  process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
