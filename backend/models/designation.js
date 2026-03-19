const mongoose = require("mongoose");

const Designation = mongoose.model(
  "designations",
  mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
      },
      status: {
        type: String,
        default: "active",
      },
    },
    { timestamps: true }
  )
);

module.exports = Designation;
