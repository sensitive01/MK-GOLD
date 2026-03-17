const mongoose = require("mongoose");

const Customer = mongoose.model(
  "customers",
  mongoose.Schema(
    {
      customerId: {
        type: String,
        unique: true,
        default: function () {
          return `BGC${this.customerIdSeq.toString().padStart(3, "0")}`;
        },
      },
      customerIdSeq: {
        type: Number,
        unique: true,
      },
      branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "branches",
      },
      email: {
        type: String,
      },
      name: {
        type: String,
      },
      gender: {
        type: String,
      },
      dob: {
        type: String,
      },
      phoneNumber: {
        type: String,
        required: true,
        unique: true,
      },
      alternatePhoneNumber: {
        type: String,
      },
      referralPhoneNumber: {
        type: String,
      },
      maritalStatus: {
        type: String,
      },
      employment: mongoose.Schema({
        employmentType: {
          type: String,
          required: true,
        },
        organisation: {
          type: String,
          required: true,
        },
        annualIncome: {
          type: String,
          required: true,
        },
      }),
      otp: {
        type: String,
      },
      address: [
        mongoose.Schema(
          {
            address: {
              type: String,
              required: true,
            },
            area: {
              type: String,
              required: true,
            },
            city: {
              type: String,
              required: true,
            },
            state: {
              type: String,
              required: true,
            },
            pincode: {
              type: String,
              required: true,
            },
            landmark: {
              type: String,
              required: true,
            },
            residential: {
              type: String,
              required: true,
            },
            label: {
              type: String,
              required: true,
            },
          },
          { timestamps: true }
        ),
      ],
      bank: [
        mongoose.Schema({
          accountNo: {
            type: String,
            required: true,
          },
          accountHolderName: {
            type: String,
            required: true,
          },
          ifscCode: {
            type: String,
            required: true,
          },
          bankName: {
            type: String,
            required: true,
          },
          branch: {
            type: String,
            required: true,
          },
        }),
      ],
      source: {
        type: String,
      },
      label: {
        type: String,
      },
      status: {
        type: String,
        required: true,
        default: "active",
      },
    },
    { timestamps: true }
  )
);

module.exports = Customer;
