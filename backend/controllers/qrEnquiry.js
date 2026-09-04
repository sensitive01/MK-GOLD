const qrService = require("../services/qrEnquiry");
const otpService = require("../services/otp");
const { sendWhatsAppOtp, sendValidationUpdate } = require("../services/whatsapp");
const Customer = require("../models/customer");
const Branch = require("../models/branch");

async function sendOtp(req, res) {
  try {
    const { phoneNumber } = req.body;
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    await otpService.create({ phoneNumber, otp, type: 'enquiry' });
    
    const whatsappResult = await sendWhatsAppOtp(phoneNumber, otp);
    
    if (!whatsappResult.success) {
      return res.json({ status: false, message: "Failed to send OTP via WhatsApp" });
    }

    res.json({ status: true, message: "OTP sent successfully via WhatsApp" });
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

    // Check if customer already exists in our database
    const customer = await Customer.findOne({ phoneNumber }).lean().exec();
    if (customer) {
      formData.mkgCustomerId = customer.customerId;
    } else {
      formData.mkgCustomerId = null;
    }

    const result = await qrService.create({ ...formData, phoneNumber });

    // Send WhatsApp confirmation update with KYC link
    try {
      let branchName = "MK Gold";
      if (result.branch) {
        const branchRecord = await Branch.findById(result.branch).select("branchName").lean().exec();
        if (branchRecord && branchRecord.branchName) {
          branchName = branchRecord.branchName;
        }
      }
      
      const baseUrl = process.env.PUBLIC_APP_URL || "https://mkgold.tech";
      const kycLink = `${baseUrl}/k/${result.enqID}`;
      const customerId = result.mkgCustomerId || result.enqID;

      await sendValidationUpdate(phoneNumber, result.name, branchName, customerId, kycLink);
    } catch (whatsappErr) {
      console.error("Failed to send validation WhatsApp update:", whatsappErr.message);
    }

    res.json({ status: true, data: result });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

async function getEnquiries(req, res) {
  try {
    const query = req.body || {};
    if (req.user && req.user.branch) {
      query.branch = req.user.branch?._id || req.user.branch;
    }
    res.json({ status: true, data: await qrService.find(query) });
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

async function findByEnqIdStrict(req, res) {
  try {
    const { enqId } = req.params;
    if (!enqId) {
      return res.json({ status: false, message: "Enquiry ID is required" });
    }

    // Only search by enqID without fallbacks for public security
    const trimmedId = enqId.trim();
    let result = await qrService.findOne({
      enqID: { $regex: new RegExp("^" + trimmedId + "$", "i") }
    });

    if (!result) {
      return res.json({ status: false, message: "Enquiry not found or Invalid ID" });
    }
    res.json({ status: true, data: result });
  } catch (err) {
    res.json({ status: false, message: err.message });
  }
}

module.exports = { sendOtp, verifyOtp, verifyAndSubmit, getEnquiries, findByEnqId, findByEnqIdStrict };
