const mongoose = require("mongoose");

const GoldRate = mongoose.model(
  "goldRates",
  mongoose.Schema(
    {
      rate: {
        type: Number,
        required: true,
      },
      type: {
        type: String,
        required: true,
      },
      date: {
        type: Date,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
    },
    { timestamps: true }
  )
);

module.exports = GoldRate;
