const mongoose = require("mongoose");

const Salary = mongoose.model(
  "salaries",
  mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "employees",
        required: true,
      },
      salaryDays: {
        type: String,
        required: true,
      },
      leaves: {
        type: String,
        required: true,
      },
      allowances: {
        type: String,
        required: true,
      },
      deductions: {
        type: String,
        required: true,
      },
      advanceSalary: {
        type: String,
        required: true,
      },
      salary: {
        type: String,
        required: true,
      },
      payableSalary: {
        type: String,
        required: true,
      },
      salaryMonth: {
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

module.exports = Salary;
