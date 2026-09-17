const goldRateService = require("../../services/goldrate");
const customerService = require("../../services/customer");
const salesService = require("../../services/sales");
const expenseService = require("../../services/expense");

async function get(req, res) {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const now = new Date();
  const istDateStr = new Date(now.getTime() + istOffset).toISOString().slice(0, 10);
  const todayStart = new Date(new Date(istDateStr + "T00:00:00.000Z").getTime() - istOffset);
  const todayEnd = new Date(new Date(istDateStr + "T23:59:59.999Z").getTime() - istOffset);

  const goldRate = await goldRateService.findOne({
    date: istDateStr,
    state: "Karnataka",
    type: "gold",
  });
  const totalGrossWeight = await salesService.aggregate([
    { $unwind: "$ornaments" },
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$ornaments.grossWeight" } } },
  ]);
  const totalNetAmount = await salesService.aggregate([
    { $unwind: "$ornaments" },
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$ornaments.netAmount" } } },
  ]);
  const totalExpenses = await expenseService.aggregate([
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  res.json({
    status: true,
    message: "",
    data: {
      todayGoldRate: goldRate?.rate ?? 0,
      todayCustomers: await customerService.count({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      todayBills: await salesService.count({
        createdAt: { $gte: todayStart, $lte: todayEnd },
      }),
      todayPhysicalBills: await salesService.count({
        createdAt: { $gte: todayStart, $lte: todayEnd },
        saleType: "physical",
      }),
      todayPledgeBills: await salesService.count({
        createdAt: { $gte: todayStart, $lte: todayEnd },
        saleType: "pledged",
      }),
      totalGrossWeight: totalGrossWeight[0]?.total || 0,
      totalNetAmount: totalNetAmount[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
    },
  });
}

module.exports = { get };
