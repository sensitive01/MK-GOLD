const goldRateService = require("../../services/goldrate");

async function latest(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await goldRateService.latest(req.body),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { latest };
