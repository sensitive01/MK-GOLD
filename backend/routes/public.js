const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrEnquiry");
const branchService = require("../services/branch");

const multer = require("../config/multer");
const kycController = require("../controllers/public/kyc");

// Public endpoints for QR scanning
router.post("/qr-enquiry/send-otp", qrController.sendOtp);
router.post("/qr-enquiry/verify-otp", qrController.verifyOtp);
router.post("/qr-enquiry/submit", qrController.verifyAndSubmit);
router.get("/qr-enquiry/get-by-enqid/:enqId", qrController.findByEnqIdStrict);

// Public endpoints for KYC
router.post("/kyc/customer", kycController.createCustomer);
router.post("/kyc/file-upload", multer.single("uploadedFile"), kycController.createFile);
router.post("/kyc/address", kycController.createAddress);

// Get branch info anonymously for the public page
router.get("/branch/:id", async (req, res) => {
  try {
    const branch = await branchService.findById(req.params.id);
    res.json({ status: true, data: branch });
  } catch (err) {
    res.json({ status: false, message: "Branch not found" });
  }
});

module.exports = router;
