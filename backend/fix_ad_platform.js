const mongoose = require('mongoose');
const Campaign = require('./models/campaign');

mongoose.connect('mongodb+srv://techsensitivecoin_db_user:UnSc9kVfp56XKV1C@cluster0.oilpzww.mongodb.net/mk-gold', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('Connected to DB');
    const rawCampaigns = await Campaign.collection.find({}).toArray();
    for (const c of rawCampaigns) {
      if (Array.isArray(c.adPlatform)) {
        console.log('Fixing campaign:', c.campaignId, 'adPlatform:', c.adPlatform);
        await Campaign.collection.updateOne(
          { _id: c._id },
          { $set: { adPlatform: c.adPlatform[0] || '' } }
        );
      }
    }
    console.log('Fix complete.');
    mongoose.connection.close();
  })
  .catch(err => console.error(err));
  