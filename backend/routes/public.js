const express = require("express");
const router = express.Router();
const qrController = require("../controllers/qrEnquiry");
const branchService = require("../services/branch");

// Public endpoints for QR scanning
router.post("/qr-enquiry/send-otp", qrController.sendOtp);
router.post("/qr-enquiry/submit", qrController.verifyAndSubmit);

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
