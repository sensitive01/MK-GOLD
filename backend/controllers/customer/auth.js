const jwt = require("jsonwebtoken");
const customerService = require("../../services/customer");
const Customer = require("../../models/customer");
const otpService = require("../../services/otp");
const axios = require("axios");
const { sendWhatsAppOtp } = require("../../services/whatsapp");

async function login(req, res) {
  try {
    let customer = await Customer.findOne({
      phoneNumber: req.body.phoneNumber,
    }).exec();

    if (!customer) {
      customer = await customerService.create({
        phoneNumber: req.body.phoneNumber,
      });
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000)).substring(0, 4);

    const whatsappResult = await sendWhatsAppOtp(req.body.phoneNumber, otp);

    if (!whatsappResult.success) {
      return res.json({
        status: false,
        message: "Failed to send OTP via WhatsApp",
        data: {},
      });
    }

    const token = jwt.sign(
      {
        otp: otp,
        phoneNumber: req.body.phoneNumber,
      },
      process.env.SECRET,
      { expiresIn: "5m" }
    );

    await otpService.create({
      type: "customer",
      otp: otp,
      phoneNumber: req.body.phoneNumber,
    });

    return res.json({
      status: true,
      message: "OTP sent successfully via WhatsApp.",
      data: { token, otp },
    });
  } catch (err) {
    return res.json({
      status: false,
      message: "Login failed",
      data: {},
    });
  }
}

async function verifyOtp(req, res) {
  try {
    let payload = jwt.verify(req.body.token, process.env.SECRET);

    if (String(payload.otp) !== String(req.body.otp)) {
      throw new Error("Invalid otp");
    }

    let customer = await Customer.findOne({
      phoneNumber: payload.phoneNumber,
    }).exec();

    if (!customer) {
      throw new Error("Invalid otp");
    }

    const token = jwt.sign(
      {
        id: customer._id,
        customerId: customer.customerId,
        phoneNumber: customer.phoneNumber,
      },
      process.env.SECRET
    );

    return res.json({
      status: true,
      message: "Logged in successfully",
      data: { customer, token },
    });
  } catch (err) {
    return res.json({
      status: false,
      message: "Invalid otp",
      data: null,
    });
  }
}

async function verifyToken(req, res, next) {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.split(" ")[0] === "Bearer"
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.query && req.query.token) {
      token = req.query.token;
    }

    let payload = jwt.verify(token, process.env.SECRET);

    if (payload.otp != req.body.otp) {
      throw new Error("Invalid token");
    }

    let customer = await Customer.findById(payload.id).exec();

    if (!customer) {
      throw new Error("Invalid token");
    }

    req.user = customer;
    next();
  } catch (err) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized",
      data: null,
    });
  }
}

module.exports = { login, verifyOtp, verifyToken };
