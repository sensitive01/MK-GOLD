const mongoose = require("mongoose");

const Sales = mongoose.model(
  "sales",
  mongoose.Schema(
    {
      billId: {
        type: String,
        unique: true,
        required: true,
      },
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
        required: true,
      },
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "customers",
        required: true,
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
        required: true,
      },
      saleType: {
        type: String,
        required: true,
      },
      purchaseType: {
        type: String,
        required: true,
      },
      release: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "releases",
        },
      ],
      ornaments: [
        mongoose.Schema(
          {
            ornamentType: {
              type: String,
              required: true,
            },
            quantity: {
              type: Number,
              required: true,
            },
            grossWeight: {
              type: Number,
              required: true,
            },
            stoneWeight: {
              type: Number,
              required: true,
            },
            netWeight: {
              type: Number,
              required: true,
            },
            purity: {
              type: Number,
              required: true,
            },
            netAmount: {
              type: Number,
              required: true,
            },
            status: {
              type: String,
              required: true,
              default: "hold",
            },
            movedAt: {
              type: Date,
            },
          },
          { timestamps: true }
        ),
      ],
      dop: {
        type: String,
        required: true,
      },
      goldRate: {
        type: Number,
      },
      silverRate: {
        type: Number,
      },
      netWeight: {
        type: Number,
        required: true,
      },
      netAmount: {
        type: Number,
        required: true,
      },
      paymentType: {
        type: String,
        required: true,
      },
      margin: {
        type: Number,
        required: true,
      },
      payableAmount: {
        type: Number,
        required: true,
      },
      cashAmount: {
        type: Number,
      },
      bank: {
        type: mongoose.Schema.Types.ObjectId,
      },
      bankAmount: {
        type: Number,
      },
      status: {
        type: String,
        required: true,
        default: "pending",
      },
    },
    { timestamps: true }
  )
);

module.exports = Sales;
