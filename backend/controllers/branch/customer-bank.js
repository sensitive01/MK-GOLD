const customerBankService = require("../../services/customer-bank");
const fileUploadService = require("../../services/fileupload");

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: (await customerBankService.findById(req.params.id))?.bank ?? [],
  });
}

async function create(req, res) {
  try {
    const payload = { ...req.body };
    payload.createdBy = req.user.employee || req.user._id;
    let createdData = await customerBankService.create(payload);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: {
          uploadId: createdData.bank[createdData.bank.length - 1]._id,
          uploadName: "customer_bank",
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

async function update(req, res) {
  try {
    const payload = { ...req.body };
    payload.updatedBy = req.user?.employee || req.user?._id;
    const customerId = req.body.customerId;
    const bankId = req.params.id;
    const result = await customerBankService.update(customerId, bankId, payload);
    res.json({
      status: true,
      message: "Bank details updated successfully",
      data: result,
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message || "Failed to update bank details",
      data: {},
    });
  }
}

async function remove(req, res) {
  try {
    await fileUploadService.removeMany({
      uploadId: {
        $in: req.params.id.split(","),
      },
      uploadName: "customer_bank",
    });
    res.json({
      status: true,
      message: "",
      data: await customerBankService.remove(
        req.body.customerId,
        req.params.id
      ),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { findById, create, update, remove };

