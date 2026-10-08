const Model = require('../models/melting');

async function find(query = {}) {
  return await Model.find(query)
    .populate('transitIds')
    .populate('transitId')
    .populate('saleIds')
    .populate('meltProof')
    .populate('preMeltProof')
    .populate('afterMeltProof')
    .populate('createdBy', 'name')
    .populate('vendor')
    .sort({ createdAt: -1 })
    .exec();
}

async function create(payload) {
  const item = new Model(payload);
  return await item.save();
}

async function update(id, payload) {
  return await Model.findByIdAndUpdate(id, payload, { new: true }).exec();
}

async function remove(id) {
  return await Model.findByIdAndDelete(id).exec();
}

async function generateUniqueBatchNumber() {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, '');
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  let count = await Model.countDocuments({
    createdAt: { $gte: todayStart, $lte: todayEnd }
  });

  let attempt = 0;
  while (attempt < 1000) {
    const seq = String(count + 1 + attempt).padStart(3, '0');
    const candidate = `MB-${dateStr}-${seq}`;
    const exists = await Model.exists({ batchNumber: candidate });
    if (!exists) {
      return candidate;
    }
    attempt++;
  }
  return `MB-${dateStr}-${Date.now().toString().slice(-4)}`;
}

module.exports = { find, create, update, remove, generateUniqueBatchNumber };
