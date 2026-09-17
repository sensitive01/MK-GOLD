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

async function update(customerId, id, payload) {
  try {
    const Sales = require("../models/sales");
    // Validate if any sale linked to this bank has completed final finance approval
    const completedSale = await Sales.findOne({
      customer: customerId,
      bank: id,
      $or: [{ financeCompleted: true }, { status: "completed" }],
    }).lean().exec();

    if (completedSale) {
      throw new Error(
        "Bank details cannot be edited after final finance approval has been completed."
      );
    }

    const customer = await Customer.findById(customerId).exec();
    if (!customer) {
      throw new Error("Customer not found");
    }

    const bank = customer.bank.id(id);
    if (!bank) {
      throw new Error("Bank details not found");
    }

    if (payload.accountNo !== undefined) bank.accountNo = payload.accountNo;
    if (payload.accountHolderName !== undefined) bank.accountHolderName = payload.accountHolderName;
    if (payload.ifscCode !== undefined) bank.ifscCode = payload.ifscCode;
    if (payload.bankName !== undefined) bank.bankName = payload.bankName;
    if (payload.branch !== undefined) bank.branch = payload.branch;
    if (payload.updatedBy !== undefined) bank.updatedBy = payload.updatedBy;

    await customer.save();

    // Also update any active sales financePayments snapshot if present
    await Sales.updateMany(
      {
        customer: customerId,
        "financePayments.bank.bankId": id,
        financeCompleted: { $ne: true },
        status: { $ne: "completed" },
      },
      {
        $set: {
          "financePayments.$[elem].bank.accountNo": payload.accountNo || bank.accountNo,
          "financePayments.$[elem].bank.bankName": payload.bankName || bank.bankName,
        },
      },
      {
        arrayFilters: [{ "elem.bank.bankId": id }],
      }
    ).exec();

    // Log to enquiry if ID is provided
    if (customer && customer.enqID) {
      const QREnquiry = require("../models/qrEnquiry");
      await QREnquiry.findOneAndUpdate(
        { enqID: customer.enqID },
        {
          $push: {
            actionLog: {
              action: "Bank Updated",
              performedBy: payload.updatedBy || payload.createdBy,
              performedAt: new Date(),
              comments: `Bank updated: ${payload.bankName || bank.bankName} (${payload.accountNo || bank.accountNo})`,
            },
          },
        }
      );
    }

    return {
      bank,
      fileUpload: {
        uploadId: bank._id,
        uploadName: "customer_bank",
      },
    };
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

module.exports = { findById, create, update, remove };

