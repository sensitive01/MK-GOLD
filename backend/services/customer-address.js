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
    const QREnquiry = require("../models/qrEnquiry");
    const customer = await Customer.findById(payload.customerId).exec();
    
    const rawAddr = (Array.isArray(payload.address) && payload.address.length > 0)
      ? payload.address[0]
      : payload;

    const data = {
      address: typeof rawAddr.address === 'string' ? rawAddr.address : (typeof payload.address === 'string' ? payload.address : ''),
      area: rawAddr.area || payload.area || '',
      city: rawAddr.city || payload.city || '',
      state: rawAddr.state || payload.state || '',
      pincode: String(rawAddr.pincode || payload.pincode || ''),
      landmark: rawAddr.landmark || payload.landmark || 'N/A',
      residential: rawAddr.residential || payload.residential || 'Owned',
      label: rawAddr.label || payload.label || 'Home',
      createdBy: payload.createdBy || rawAddr.createdBy,
    };
    const updatedCustomer = await Customer.findByIdAndUpdate(
      payload.customerId || rawAddr.customerId,
      { $push: { address: data } },
      {
        returnDocument: "after",
      }
    ).exec();

    // Log to enquiry if ID is provided
    if (customer && customer.enqID) {
      await QREnquiry.findOneAndUpdate(
        { enqID: customer.enqID },
        {
          $push: {
            actionLog: {
              action: "Address Added",
              performedBy: payload.createdBy,
              performedAt: new Date(),
              comments: `New address added: ${payload.label}`
            }
          }
        }
      );
    }

    return updatedCustomer;
  } catch (err) {
    throw err;
  }
}

async function update(customerId, addressId, payload) {
  try {
    const updateFields = {};
    if (payload.address !== undefined) updateFields["address.$.address"] = payload.address;
    if (payload.area !== undefined) updateFields["address.$.area"] = payload.area;
    if (payload.city !== undefined) updateFields["address.$.city"] = payload.city;
    if (payload.state !== undefined) updateFields["address.$.state"] = payload.state;
    if (payload.pincode !== undefined) updateFields["address.$.pincode"] = String(payload.pincode);
    if (payload.landmark !== undefined) updateFields["address.$.landmark"] = payload.landmark;
    if (payload.residential !== undefined) updateFields["address.$.residential"] = payload.residential;
    if (payload.label !== undefined) updateFields["address.$.label"] = payload.label;

    const updatedCustomer = await Customer.findOneAndUpdate(
      { _id: customerId, "address._id": addressId },
      { $set: updateFields },
      {
        returnDocument: "after",
      }
    ).exec();

    // Invalidate cached invoice PDF for any sales of this customer so fresh address appears
    try {
      const Sales = require("../models/sales");
      await Sales.updateMany(
        { customer: customerId },
        { $set: { invoicePdfUrl: "" } }
      ).exec();
    } catch (e) {
      console.warn("Could not invalidate invoicePdfUrl for sales:", e.message);
    }

    return updatedCustomer;
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

module.exports = { findById, create, update, remove };
