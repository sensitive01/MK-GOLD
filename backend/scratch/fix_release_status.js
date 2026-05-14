const mongoose = require('mongoose');
const DB_HOST = "mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold";

mongoose.connect(DB_HOST).then(async () => {
  const Release = mongoose.model('releases', new mongoose.Schema({ status: String }));
  const result = await Release.updateMany({ status: 'finance pending' }, { $set: { status: 'release pending' } });
  console.log(JSON.stringify(result));
  process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
