require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function migratePasswords() {
  try {
    console.log("Connecting...");
    await mongoose.connect(process.env.DB_HOST);
    
    const users = await User.find({});
    console.log(`Found ${users.length} users.`);

    for (const user of users) {
      if (!user.password) continue;
      
      const isPlain = !user.password.startsWith('$2a$') && 
                      !user.password.startsWith('$2b$');

      if (isPlain) {
        console.log(`Hashing existing plain-text password for: ${user.username || 'unknown user'}`);
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(user.password, salt);
        
        // Update directly in MongoDB to avoid validation issues with other fields
        await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
      }
    }

    console.log("Migration finished.");
    process.exit(0);
  } catch (error) {
    console.error("Migration Error:", error.message);
    process.exit(1);
  }
}

migratePasswords();
