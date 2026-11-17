const customerAddressService = require("../../services/customer-address");
const fileUploadService = require("../../services/fileupload");

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: (await customerAddressService.findById(req.params.id))?.address ?? [],
  });
}

async function create(req, res) {
  try {
    const payload = { ...req.body };
    payload.createdBy = req.user.employee || req.user._id;
    let createdData = await customerAddressService.create(payload);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: {
          uploadId: createdData.address[createdData.address.length - 1]._id,
          uploadName: "customer_address",
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
    if (req.user?.userType?.toLowerCase() === "bullion_desk") {
      return res.status(403).json({
        status: false,
        message: "Forbidden: Bullion Desk does not have permission to edit customer address",
        data: {},
      });
    }
    const customerId = req.params.id || req.body.customerId;
    const addressId = req.body.addressId || req.body._id;
    const updatedData = await customerAddressService.update(customerId, addressId, req.body);
    res.json({
      status: true,
      message: "Address updated successfully",
      data: {
        data: updatedData,
        fileUpload: {
          uploadId: addressId,
          uploadName: "customer_address",
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

async function remove(req, res) {
  try {
    await fileUploadService.removeMany({
      uploadId: {
        $in: req.params.id.split(","),
      },
      uploadName: "customer_address",
    });
    res.json({
      status: true,
      message: "",
      data: await customerAddressService.remove(
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
