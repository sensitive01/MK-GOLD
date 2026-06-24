const Model = require('../models/vendor');

async function getNextVendorId() {
  const lastRecord = await Model.findOne().sort({ vendorIdSeq: -1 });
  const seq = lastRecord && lastRecord.vendorIdSeq ? lastRecord.vendorIdSeq + 1 : 1;
  return {
    seq,
    id: `VEN${seq.toString().padStart(3, '0')}`
  };
}

async function find(query = {}) {
  return await Model.find(query).sort({ createdAt: -1 }).populate('createdBy', 'name').exec();
}

async function findById(id) {
  return await Model.findById(id).exec();
}

async function create(payload) {
  const nextId = await getNextVendorId();
  payload.vendorIdSeq = nextId.seq;
  payload.vendorId = payload.vendorId || nextId.id;

  const item = new Model(payload);
  return await item.save();
}

async function update(id, payload) {
  return await Model.findByIdAndUpdate(id, payload, { new: true }).exec();
}

async function remove(id) {
  return await Model.findByIdAndDelete(id).exec();
}

module.exports = {
  find,
  findById,
  create,
  update,
  remove,
  getNextVendorId
};
