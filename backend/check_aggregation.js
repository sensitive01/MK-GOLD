const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const Attendance = require("./models/attendance");
const AttendanceService = require("./services/attendance");

async function check() {
  const uri = process.env.DB_HOST || "mongodb://127.0.0.1:27017/attica";
  await mongoose.connect(uri);

  const latAttr = await AttendanceService.find({ });
  if (latAttr.length > 0) {
    const last = latAttr[0];
    console.log("Latest Aggregated Attendance Record:");
    console.log(JSON.stringify(last, null, 2));
  } else {
    console.log("No Aggregated Attendance records found.");
  }

  await mongoose.disconnect();
}

check();
