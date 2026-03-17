const Customer = require("../models/customer");

async function findById(id) {
  try {
    return await Customer.findById(id, { address: 1, _id: 0 }).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    const data = {
      address: payload.address,
      area: payload.area,
      city: payload.city,
      state: payload.state,
      pincode: payload.pincode,
      landmark: payload.landmark,
      residential: payload.residential,
      label: payload.label,
    };
    return await Customer.findByIdAndUpdate(
      payload.customerId,
      { $push: { address: data } },
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
      { $pull: { address: { _id: id } } },
      {
        returnDocument: "after",
      }
    ).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { findById, create, remove };
