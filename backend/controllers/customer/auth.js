const jwt = require("jsonwebtoken");
const customerService = require("../../services/customer");
const Customer = require("../../models/customer");
const otpService = require("../../services/otp");
const axios = require("axios");

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

    console.log("BYPASSING SMS: Customer OTP for", req.body.phoneNumber, "is", otp);

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
      message: "OTP generated successfully (SMS bypassed).",
      data: { token, otp },
    });

    /*
    let data = await axios.get(
      `https://pgapi.vispl.in/fe/api/v1/send?username=mkgold.trans&password=hhwGK&unicode=false&from=MKGOLD&to=${req.body.phoneNumber}&text=Hi.%20Your%20One%20Time%20Password%20to%20login%20MK%20Gold%20World%20is%20${otp}.%20This%20OTP%20is%20valid%20for%205%20minutes%20only.&dltContentId=1707168542360758659`
    );
    if (data.data.statusCode == 200 && data.data.state == "SUBMIT_ACCEPTED") {
      const token = jwt.sign(
        {
          otp: otp,
          phoneNumber: req.body.phoneNumber,
        },
        process.env.SECRET,
        { expiresIn: "5m" }
      );

      otpService.create({
        type: "customer",
        otp: otp,
        phoneNumber: req.body.phoneNumber,
      });

      return res.json({
        status: true,
        message: "OTP sent successfully",
        data: { token, otp },
      });
    } else {
      return res.json({
        status: false,
        message: "OTP not sent",
        data: {},
      });
    }
    */
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
