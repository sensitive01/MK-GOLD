const goldRateService = require("../../services/goldrate");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await goldRateService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await goldRateService.findById(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function findOne(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await goldRateService.findOne(req.body),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, findOne };
