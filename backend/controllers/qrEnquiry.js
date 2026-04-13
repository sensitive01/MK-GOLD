const qrService = require("../services/qrEnquiry");
const otpService = require("../services/otp");
const smsService = require("../services/sms");

async function sendOtp(req, res) {
  try {
    const { phoneNumber } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    await otpService.create({ phoneNumber, otp });
    await smsService.sendOtpSms(phoneNumber, otp);

    res.json({ status: true, message: "OTP sent successfully" });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function verifyAndSubmit(req, res) {
  try {
    const { phoneNumber, otp, skipOtp, ...formData } = req.body;
    
    // Check if an enquiry already exists for this phone number
    const existing = await qrService.findOne({ phoneNumber });
    if (existing) {
        return res.json({ 
            status: true, 
            alreadyExists: true,
            message: "You are already registered.",
            data: existing 
        });
    }

    // OTP verification removed as per user request
    const result = await qrService.create({ ...formData, phoneNumber });
    res.json({ status: true, data: result });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function getEnquiries(req, res) {
    try {
        res.json({ status: true, data: await qrService.find(req.body) });
    } catch (err) {
        res.json({ status: false, message: err.message });
    }
}

async function findByMkgId(req, res) {
  try {
    const { mkgId } = req.params;
    const result = await qrService.findOne({ mkgCustomerId: mkgId });
    if (!result) {
        return res.json({ status: false, message: "Enquiry not found" });
    }
    res.json({ status: true, data: result });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

module.exports = { sendOtp, verifyAndSubmit, getEnquiries, findByMkgId };
