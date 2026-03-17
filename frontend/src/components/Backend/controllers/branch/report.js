const salesService = require("../../services/sales");

async function consolidatedSaleReport(req, res) {
  res.json({
    status: true,
    message: "",
    data: await salesService.branchConsolidatedSaleReport(req.body ?? {}),
  });
}

module.exports = { consolidatedSaleReport };
