const Model = require('../models/lead');

async function find(query = {}) {
  return await Model.find(query).sort({ createdAt: -1 }).exec();
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

module.exports = { find, create, update, remove };
