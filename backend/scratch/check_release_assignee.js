const mongoose = require('mongoose');
const DB_HOST = "mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold";

mongoose.connect(DB_HOST).then(async () => {
  const Release = mongoose.model('releases', new mongoose.Schema({ assignee: mongoose.Schema.Types.ObjectId, status: String, pledgeId: String }));
  const releases = await Release.find({ pledgeId: { $in: ['123456', '12346'] } });
  console.log(JSON.stringify(releases));
  process.exit();
}).catch(err => {
    console.error(err);
    process.exit(1);
});
