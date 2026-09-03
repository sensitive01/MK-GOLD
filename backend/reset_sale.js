const mongoose = require('mongoose');

const uri = "mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold";

async function reset() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const sales = db.collection('sales');
  
  console.log("Resetting finance approval for Bill ID 483554...");
  const result = await sales.updateOne(
    { billId: "483554" },
    { 
      $set: { 
        status: "finance pending",
        financeCompleted: false,
        financeAmount: null,
        financeProof: "",
        financeComments: ""
      }
    }
  );
  
  console.log("Modified count:", result.modifiedCount);
  process.exit(0);
}

reset().catch(console.error);
