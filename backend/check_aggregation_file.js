const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const AttendanceService = require("./services/attendance");

async function check() {
  const uri = process.env.DB_HOST || "mongodb://127.0.0.1:27017/attica";
  await mongoose.connect(uri);

  const results = await AttendanceService.find({ });
  if (results.length > 0) {
      const top = results[0];
      console.log("Attendance ID:", top._id);
      if (top.attendance) {
          console.log("Attendance result has file!");
          console.log("Uploaded File Path:", top.attendance.uploadedFile);
      } else {
          console.log("Attendance result HAS NO FILE OBJECT!");
      }
  }

  await mongoose.disconnect();
}

check();
