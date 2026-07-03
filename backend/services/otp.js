const OTP = require("../models/otp");

async function find(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      const dateStr = String(query.createdAt["$gte"]).substring(0, 10);
      query.createdAt["$gte"] = new Date(`${dateStr}T00:00:00.000+05:30`);
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      const dateStr = String(query.createdAt["$lte"]).substring(0, 10);
      query.createdAt["$lte"] = new Date(`${dateStr}T23:59:59.999+05:30`);
    }
    return await OTP.find(query).sort({ createdAt: -1 }).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    return await OTP.findById(id).exec();
  } catch (err) {
    throw err;
  }
}

async function findOne(query) {
  try {
    return await OTP.findOne(query).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let otp = new OTP(payload);
    return await otp.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await OTP.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await OTP.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  findOne,
  create,
  update,
  remove,
};
