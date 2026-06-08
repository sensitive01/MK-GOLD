require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');

async function resetAllPasswords() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.DB_HOST);
    console.log("Connected successfully.");

    const users = await User.find({});
    console.log(`Found ${users.length} users in the database.`);

    const newPassword = "123456";
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    console.log(`Updating password to hashed "123456" for all ${users.length} users...`);

    const result = await User.updateMany({}, { $set: { password: hashed } });
    console.log(`Updated ${result.modifiedCount} user records.`);

    console.log("Password reset completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("Error resetting passwords:", error.message);
    process.exit(1);
  }
}

resetAllPasswords();
