const customerService = require("../../services/customer");

async function get(req, res) {
  res.json({
    status: true,
    message: "",
    data: await customerService.findById(req.user.id),
  });
}

async function update(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await customerService.update(req.user.id, req.body),
    });
  } catch (err) {
    res.status(400).json({
      status: false,
      message: err.message,
      data: null,
    });
  }
}

module.exports = { get, update };
