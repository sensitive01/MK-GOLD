const QREnquiry = require("../models/qrEnquiry");

async function generateMkgId() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const nums = "0123456789";
  
  let isUnique = false;
  let finalId = "";

  while (!isUnique) {
    // Generate 3 random numbers and 1 random letter
    let parts = [];
    for (let i = 0; i < 3; i++) parts.push(nums[Math.floor(Math.random() * nums.length)]);
    parts.push(chars[Math.floor(Math.random() * chars.length)]);

    // Shuffle them
    for (let i = parts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [parts[i], parts[j]] = [parts[j], parts[i]];
    }

    finalId = "MK" + parts.join("");

    // Check uniqueness
    const existing = await QREnquiry.findOne({ mkgCustomerId: finalId });
    if (!existing) isUnique = true;
  }

  return finalId;
}

async function find(query = {}) {
  return await QREnquiry.find(query).populate("branch").sort({ createdAt: -1 }).exec();
}

async function findOne(query = {}) {
  return await QREnquiry.findOne(query).populate("branch").exec();
}

async function create(payload) {
  const mkgId = await generateMkgId();
  payload.mkgCustomerId = mkgId;
  const enquiry = new QREnquiry(payload);
  return await enquiry.save();
}

module.exports = { find, create, findOne };
