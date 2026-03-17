const Customer = require("../models/customer");
const otpService = require("./otp");
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");

async function find(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    if (!query.phoneNumber) {
      delete query.phoneNumber;
    }
    return await Customer.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "profileImage",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "customer",
          as: "sales",
        },
      },
      {
        $addFields: {
          profileImage: { $first: "$profileImage" },
          branch: { $first: "$branch" },
        },
      },
      {
        $match: {
          sales: { $eq: [] },
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await Customer.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "profileImage",
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $addFields: {
          profileImage: { $first: "$profileImage" },
          branch: { $first: "$branch" },
        },
      },
      { $limit: 1 },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function count(query = {}) {
  try {
    if (query.createdAt) {
      query.createdAt = new Date(query.createdAt).toISOString();
      query.createdAt = {
        $gte: new Date(query.createdAt.replace(/T.*Z/, "T00:00:00Z")),
        $lte: new Date(query.createdAt.replace(/T.*Z/, "T23:59:59Z")),
      };
    }
    return await Customer.count(query);
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    const latestSeq = await Customer.findOne({})
      .sort({ customerIdSeq: -1 })
      .exec();
    payload.customerIdSeq = (latestSeq?.customerIdSeq ?? 0) + 1;
    let customer = new Customer(payload);
    return await customer.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Customer.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Customer.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function sendOtp(payload) {
  try {
    const otp = String(Math.floor(100000 + Math.random() * 900000)).substring(
      0,
      6
    );

    const smsService = require("./sms");
    const smsRes = await smsService.sendOtpSms(payload.phoneNumber, otp);

    if (smsRes.success) {
      const token = jwt.sign(
        {
          sub: {
            phoneNumber: payload.phoneNumber,
            otp,
          },
          iat: new Date().getTime(),
        },
        process.env.SECRET,
        { expiresIn: "5m" }
      );

      await otpService.create({
        type: "customer",
        otp: otp,
        phoneNumber: payload.phoneNumber,
      });

      return {
        status: true,
        message: "OTP sent Successfully.",
        data: { token },
      };
    } else {
      console.log("OTP failed with error:", smsRes.error);
      return {
        status: false,
        message: `OTP not sent: ${smsRes.error}`,
        data: { error: smsRes.error },
      };
    }
  } catch (err) {
    console.error("OTP Error exception:", err.message);
    return {
      status: false,
      message: `OTP Error: ${err.message}`,
      data: {},
    };
  }
}

function verifyOtp(payload) {
  try {
    const decoded = jwt.verify(payload.token, process.env.SECRET);
    const data = decoded.sub;
    if (!decoded) {
      return {
        status: false,
        message: "Otp is expired.",
        data: {},
      };
    }

    if (String(data.otp) !== String(payload.otp)) {
      return {
        status: false,
        message: "Invalid otp.",
        data: {},
      };
    }

    return {
      status: true,
      message: "OTP verified.",
      data: {},
    };
  } catch (err) {
    return {
      status: false,
      message: "Invalid otp.",
      data: {},
    };
  }
}

module.exports = {
  find,
  findById,
  count,
  create,
  update,
  remove,
  sendOtp,
  verifyOtp,
};
