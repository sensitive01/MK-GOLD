require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.DB_HOST);
  console.log('Connected to DB');

  const Sales = require('./models/sales');
  const FileUpload = require('./models/fileupload');

  // Get the most recently updated sale
  const sale = await Sales.findOne({}).sort({ updatedAt: -1 }).lean();
  console.log('\n=== Most Recently Updated Sale ===');
  console.log(`Bill ID: ${sale.billId}`);
  console.log(`Status: ${sale.status}`);
  console.log(`financeProof: "${sale.financeProof}"`);
  console.log(`financeComments: "${sale.financeComments}"`);
  console.log(`financeCompleted: ${sale.financeCompleted}`);
  console.log(`updatedAt: ${sale.updatedAt}`);

  // Get all files uploaded in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentFiles = await FileUpload.find({ createdAt: { $gte: fiveMinutesAgo } }).lean();
  console.log(`\n=== Files Uploaded in Last 5 Minutes (${recentFiles.length} found) ===`);
  recentFiles.forEach(f => {
    console.log(`  uploadId: ${f.uploadId}`);
    console.log(`  uploadedFile: ${f.uploadedFile}`);
    console.log(`  documentType: ${f.documentType || 'N/A'}`);
    console.log(`  created: ${f.createdAt}`);
    console.log('  ---');
  });

  await mongoose.disconnect();
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
