const Customer = require("../models/customer");

async function findById(id) {
  try {
    return await Customer.findById(id, { bank: 1, _id: 0 }).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    const data = {
      accountNo: payload.accountNo,
      accountHolderName: payload.accountHolderName,
      ifscCode: payload.ifscCode,
      bankName: payload.bankName,
      branch: payload.branch,
    };
    return await Customer.findByIdAndUpdate(
      payload.customerId,
      { $push: { bank: data } },
      {
        returnDocument: "after",
      }
    ).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(customerId, id) {
  try {
    return await Customer.findByIdAndUpdate(
      customerId,
      { $pull: { bank: { _id: id } } },
      {
        returnDocument: "after",
      }
    ).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { findById, create, remove };
