const mongoose = require('mongoose');
const User = require('./backend/models/user');
require('dotenv').config({ path: './backend/.env' });

async function checkUser() {
  await mongoose.connect(process.env.DB_URI);
  const user = await User.findOne({ username: 'telecaller' });
  console.log('User found:', user);
  process.exit();
}

checkUser();
