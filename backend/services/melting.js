const Model = require('../models/melting');
require('../models/transit');
require('../models/sales');
require('../models/fileupload');
require('../models/vendor');
require('../models/employee');

async function find(query = {}) {
  return await Model.find(query)
    .populate({
      path: 'transitIds',
      populate: { path: 'saleIds', select: 'articleNumber ornaments' }
    })
    .populate({
      path: 'transitId',
      populate: { path: 'saleIds', select: 'articleNumber ornaments' }
    })
    .populate('saleIds')
    .populate('meltProof')
    .populate('preMeltProof')
    .populate('afterMeltProof')
    .populate('purityPhoto')
    .populate('purityCertificate')
    .populate('createdBy', 'name')
    .populate('vendor')
    .sort({ createdAt: -1 })
    .exec();
}

async function create(payload) {
  if (!payload.meltProof) {
    throw new Error('Batch proof is mandatory to create melting batch');
  }
  const item = new Model(payload);
  return await item.save();
}

async function update(id, payload) {
  if (payload.status === 'sold') {
    if (!payload.purityPhoto) {
      throw new Error('Purity photo is mandatory for vendor settlement');
    }
    if (!payload.purityCertificate) {
      throw new Error('Purity certificate is mandatory for vendor settlement');
    }
  }
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
