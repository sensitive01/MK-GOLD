const mongoose = require("mongoose");

const Fund = mongoose.model(
  "fund",
  mongoose.Schema(
    {
      amount: {
        type: Number,
        required: true,
      },
      from: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
        required: true,
      },
      to: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      note: {
        type: String,
        required: true,
      },
      status: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = Fund;
