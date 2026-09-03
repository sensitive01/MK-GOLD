const mongoose = require('mongoose');
const Sales = require('./models/sales');
const FileUpload = require('./models/fileupload');
require('dotenv').config({ path: './.env' });

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  
  const sale = await Sales.findOne({ billId: '769883' });
  if (!sale) {
    console.log("Sale not found!");
    process.exit(1);
  }

  const files = await FileUpload.find({ uploadId: sale._id });
  console.log("Files for Sale ID:", sale._id);
  files.forEach(f => {
    console.log({
      _id: f._id,
      documentType: f.documentType,
      documentTypeType: typeof f.documentType,
      documentNo: f.documentNo,
      uploadName: f.uploadName,
      uploadType: f.uploadType
    });
  });

  process.exit(0);
}

check().catch(console.error);
