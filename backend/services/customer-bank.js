const Customer = require("../models/customer");

async function findById(id) {
  try {
    const customer = await Customer.findById(id, { bank: 1, _id: 0 }).lean().exec();
    if (!customer) return null;

    const fileUpload = require("../models/fileupload");
    const bankIds = customer.bank.map(b => b._id);
    const proofs = await fileUpload.find({ uploadId: { $in: bankIds }, uploadName: "customer_bank" }).lean().exec();
    
    const banksWithProofs = customer.bank.map(b => {
      const proof = proofs.find(p => p.uploadId.toString() === b._id.toString());
      return { ...b, proof };
    });
    
    return { bank: banksWithProofs };
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    const QREnquiry = require("../models/qrEnquiry");
    const customer = await Customer.findById(payload.customerId).exec();

    const data = {
      accountNo: payload.accountNo,
      accountHolderName: payload.accountHolderName,
      ifscCode: payload.ifscCode,
      bankName: payload.bankName,
      branch: payload.branch,
      createdBy: payload.createdBy,
    };
    const updatedCustomer = await Customer.findByIdAndUpdate(
      payload.customerId,
      { $push: { bank: data } },
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
              action: "Bank Added",
              performedBy: payload.createdBy,
              performedAt: new Date(),
              comments: `New bank added: ${payload.bankName} (${payload.accountNo})`
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
