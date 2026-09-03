const mongoose = require('mongoose');

const uri = "mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold";

async function check() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const sales = db.collection('sales');
  
  console.log("Fetching latest updated sale...");
  const sale = await sales.findOne({ billId: "483554" });
  console.log(JSON.stringify(sale, null, 2));
  
  process.exit(0);
}

check().catch(console.error);
