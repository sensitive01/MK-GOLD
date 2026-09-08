const customerService = require("../../services/customer");
const customerAddressService = require("../../services/customer-address");
const fileUploadService = require("../../services/fileupload");

async function createCustomer(req, res) {
  try {
    const payload = { ...req.body };
    // Leave createdBy undefined for public submissions to avoid ObjectId CastError

    let createdData = await customerService.create(payload);
    res.json({
      status: true,
      message: "Customer created successfully",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "customer" },
      },
    });
  } catch (err) {
    res.json({
      status: false,
      message:
        err.errors ?? (err.code == 11000 ? "Mobile number already exists" : err.message),
      data: {},
    });
  }
}

async function createAddress(req, res) {
  try {
    const payload = { ...req.body };
    // Leave createdBy undefined for public submissions

    let createdData = await customerAddressService.create(payload);
    res.json({
      status: true,
      message: "Address created successfully",
      data: {
        data: createdData,
        fileUpload: {
          uploadId: createdData.address[createdData.address.length - 1]._id,
          uploadName: "customer_address",
        },
      },
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function createFile(req, res) {
  try {
    const payload = { ...req.body };
    if (req.file) {
      payload.fileName = req.file.filename;
      payload.originalName = req.file.originalname;
      payload.mimeType = req.file.mimetype;
      payload.size = req.file.size;
      payload.uploadedFile = req.file;
    }
    
    let createdData = await fileUploadService.create(payload);
    res.json({
      status: true,
      message: "File uploaded successfully",
      data: createdData,
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function sendOtp(req, res) {
  try {
    const phoneNumber = req.body?.phoneNumber;
    if (!phoneNumber) {
      return res.json({ status: false, message: "Phone number is required" });
    }
    const result = await customerService.sendOtp({ phoneNumber });
    return res.json(result);
  } catch (err) {
    return res.json({ status: false, message: err.message });
  }
}

async function verifyOtp(req, res) {
  try {
    const { token, otp } = req.body || {};
    if (!token || !otp) {
      return res.json({ status: false, message: "Token and OTP are required" });
    }
    const result = customerService.verifyOtp({ token, otp });
    return res.json(result);
  } catch (err) {
    return res.json({ status: false, message: err.message });
  }
}

module.exports = { createCustomer, createAddress, createFile, sendOtp, verifyOtp };
