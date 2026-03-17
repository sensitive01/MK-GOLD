const ornamentService = require("../../services/ornament");

async function find(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await ornamentService.find(req.body ?? {}),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message,
      data: [],
    });
  }
}

async function groupByBranchAndMovedAt(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await ornamentService.groupByBranchAndMovedAt(req.body ?? {}),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message,
      data: [],
    });
  }
}

async function getLatestPrint(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await ornamentService.getLatestPrint(req.body ?? {}),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.message,
      data: [],
    });
  }
}

async function update(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await ornamentService.update(req.body),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, update, groupByBranchAndMovedAt, getLatestPrint };
