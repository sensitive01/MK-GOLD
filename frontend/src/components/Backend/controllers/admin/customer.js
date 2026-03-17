const customerService = require("../../services/customer");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await customerService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  res.json({
    status: true,
    message: "",
    data: await customerService.findById(req.params.id),
  });
}

async function create(req, res) {
  try {
    let createdData = await customerService.create(req.body);
    res.json({
      status: true,
      message: "",
      data: {
        data: createdData,
        fileUpload: { uploadId: createdData._id, uploadName: "customer" },
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
    res.json({
      status: true,
      message: "",
      data: await customerService.update(req.params.id, req.body),
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
      uploadName: "customer",
    });
    res.json({
      status: true,
      message: "",
      data: await customerService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function sendOtp(req, res) {
  res.json(
    await customerService.sendOtp({ phoneNumber: req.body?.phoneNumber })
  );
}

async function verifyOtp(req, res) {
  res.json(
    await customerService.verifyOtp({
      token: req.body?.token,
      otp: req.body?.otp,
    })
  );
}

module.exports = { find, findById, create, update, remove, sendOtp, verifyOtp };
