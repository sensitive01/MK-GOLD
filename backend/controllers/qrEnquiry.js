const qrService = require("../services/qrEnquiry");
const otpService = require("../services/otp");
const smsService = require("../services/sms");
const Customer = require("../models/customer");

async function sendOtp(req, res) {
  try {
    const { phoneNumber } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    
    await otpService.create({ phoneNumber, otp, type: 'enquiry' });
    await smsService.sendOtpSms(phoneNumber, otp);

    res.json({ status: true, message: "OTP sent successfully" });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { phoneNumber, otp } = req.body;
    if (!otp) {
        return res.json({ status: false, message: "OTP is required" });
    }
    const otpRecord = await otpService.findOne({ phoneNumber, otp, type: 'enquiry' });
    if (!otpRecord) {
        return res.json({ status: false, message: "Invalid OTP" });
    }
    
    // Once verified, we can choose to delete it, or keep it so verifyAndSubmit can check it again
    // For a two-step process, it's safer to just confirm it's valid here
    res.json({ status: true, message: "OTP Verified" });
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

    if (!skipOtp) {
      if (!otp) {
        return res.json({ status: false, message: "OTP is required" });
      }
      const otpRecord = await otpService.findOne({ phoneNumber, otp, type: 'enquiry' });
      if (!otpRecord) {
        return res.json({ status: false, message: "Invalid OTP" });
      }
      // Remove used OTP
      await otpService.remove(otpRecord._id.toString());
    }

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

async function findByEnqId(req, res) {
  try {
    const { enqId } = req.params;
    if (!enqId) {
        return res.json({ status: false, message: "Enquiry ID is required" });
    }
    
    // Try case-insensitive and trimmed search
    const trimmedId = enqId.trim();
    let result = await qrService.findOne({ 
        enqID: { $regex: new RegExp("^" + trimmedId + "$", "i") } 
    });
    
    if (!result) {
        // Fallback 1: Check if it's a customerId (e.g., BGC001)
        const customerByCode = await Customer.findOne({ 
            customerId: { $regex: new RegExp("^" + trimmedId + "$", "i") } 
        }).select("enqID phoneNumber").lean().exec();
        
        if (customerByCode && customerByCode.enqID) {
            result = await qrService.findOne({ enqID: customerByCode.enqID });
        } else {
            // Fallback 2: Check if it's a phoneNumber
            const customerByPhone = await Customer.findOne({ 
                phoneNumber: trimmedId 
            }).select("enqID").lean().exec();
            
            if (customerByPhone && customerByPhone.enqID) {
                result = await qrService.findOne({ enqID: customerByPhone.enqID });
            } else {
                // Fallback 3: Search enquiry directly by phone
                result = await qrService.findOne({ phoneNumber: trimmedId });
            }
        }
    }
    
    if (!result) {
        return res.json({ status: false, message: "Enquiry not found" });
    }
    res.json({ status: true, data: result });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

module.exports = { sendOtp, verifyOtp, verifyAndSubmit, getEnquiries, findByEnqId };
