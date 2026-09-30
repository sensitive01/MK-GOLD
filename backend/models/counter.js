const mongoose = require("mongoose");

// Generic atomic counter document used for round-robin assignments etc.
// Each counter has a unique `key` (e.g. "telecaller_rr") and a `value` that increments atomically.
const counterSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Counter", counterSchema);
