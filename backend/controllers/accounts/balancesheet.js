const balanceSheetService = require("../../services/balancesheet");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await balanceSheetService.find(req.body ?? {}),
  });
}

async function calculateClosingBalance(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await balanceSheetService.calculateClosingBalance(req.body),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, calculateClosingBalance };
