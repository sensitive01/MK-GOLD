const mongoose = require('mongoose');

const Schema = new mongoose.Schema({
  title: String,
  description: String,
  status: { type: String, default: 'active' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('melting', Schema);
