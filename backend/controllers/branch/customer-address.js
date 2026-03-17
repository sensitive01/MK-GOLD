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
    let createdData = await customerAddressService.create(req.body);
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

module.exports = { findById, create, remove };
