const mongoose = require("mongoose");

const QREnquiry = mongoose.model(
  "qr_enquiries",
  mongoose.Schema(
    {
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
      },
      type: {
        type: String,
        enum: ["physical", "pledged"],
        required: true,
      },
      grossWeight: {
        type: Number,
        required: true,
      },
      mkgCustomerId: {
        type: String,
        unique: true,
      },
      status: {
        type: String,
        default: "pending",
      },
    },
    { timestamps: true }
  )
);

module.exports = QREnquiry;
