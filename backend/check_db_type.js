const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: ".env" });

const Attendance = require("./models/attendance");
const FileUpload = require("./models/fileupload");

async function check() {
  const uri = process.env.DB_HOST || "mongodb://127.0.0.1:27017/attica";
  await mongoose.connect(uri);

  const latAttr = await Attendance.findOne().sort({ createdAt: -1 }).exec();
  if (latAttr) {
    console.log("Attendance ID Type:", typeof latAttr._id, latAttr._id instanceof mongoose.Types.ObjectId);
    const fu = await FileUpload.findOne({ uploadId: latAttr._id }).exec();
    if (fu) {
        console.log("Found FileUpload linked to this attendance!");
        console.log("FileUpload uploadId Type:", typeof fu.uploadId, fu.uploadId instanceof mongoose.Types.ObjectId);
    } else {
        console.log("No FileUpload linked to this attendance via findOne(ObjectId)!");
        // Try searching as string
        const fuStr = await FileUpload.findOne({ uploadId: latAttr._id.toString() }).exec();
        if (fuStr) {
            console.log("Found FileUpload linked to this attendance via findOne(String)!");
        } else {
             console.log("Still not found via String search!");
        }
    }
  }

  await mongoose.disconnect();
}

check();
