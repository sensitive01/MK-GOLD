const mongoose = require("mongoose");

const Employee = mongoose.model(
  "employees",
  mongoose.Schema(
    {
      employeeId: {
        type: String,
        unique: true,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
      gender: {
        type: String,
        required: true,
      },
      dob: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      alternatePhoneNumber: {
        type: String,
      },
      designation: {
        type: String,
        required: true,
      },
      salary: {
        type: Number,
        default: 0,
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
          },
          { timestamps: true }
        ),
      ],
      shiftStartTime: {
        type: String,
        required: true,
      },
      shiftEndTime: {
        type: String,
        required: true,
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

module.exports = Employee;
