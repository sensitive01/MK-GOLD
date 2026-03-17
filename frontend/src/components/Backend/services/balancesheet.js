const Branch = require("../models/branch");
const mongoose = require("mongoose");
const Fund = require("../models/fund");

async function find(query = {}) {
  try {
    let fromDate = new Date();
    fromDate.setUTCHours(0, 0, 0, 0);
    let toDate = new Date();
    toDate.setUTCHours(23, 59, 59, 0);

    if (query.fromDate) {
      fromDate = new Date(
        new Date(query.fromDate).toISOString().replace(/T.*Z/, "T00:00:00Z")
      );
      delete query.fromDate;
    }
    if (query.toDate) {
      toDate = new Date(
        new Date(query.toDate).toISOString().replace(/T.*Z/, "T23:59:59Z")
      );
      delete query.toDate;
    }
    if (query.branch) {
      query._id = new mongoose.Types.ObjectId(query.branch);
      delete query.branch;
    } else {
      delete query.branch;
    }

    Date.prototype.addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    Date.prototype.subDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() - days);
      return date;
    };

    function getDates(startDate, stopDate) {
      var dateArray = new Array();
      var currentDate = startDate;
      while (currentDate <= stopDate) {
        dateArray.push(new Date(currentDate));
        currentDate = currentDate.addDays(1);
      }
      return dateArray;
    }

    let dates = getDates(fromDate, toDate);
    let data = [];

    for (let date of dates) {
      let tmp = await Branch.aggregate([
        { $match: query },
        {
          $lookup: {
            from: "funds",
            let: { branchId: "$_id" },
            pipeline: [
              {
                $match: {
                  $or: [
                    { $expr: { $eq: ["$from", "$$branchId"] } },
                    { $expr: { $eq: ["$to", "$$branchId"] } },
                  ],
                  createdAt: { $gte: date, $lt: date.addDays(1) },
                },
              },
              {
                $group: {
                  _id: null,
                  fundRequested: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$from", "$$branchId"] },
                            { $eq: ["$type", "fund_request"] },
                          ],
                        },
                        "$amount",
                        0,
                      ],
                    },
                  },
                  fundTransferred: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$from", "$$branchId"] },
                            { $eq: ["$type", "fund_transfer"] },
                          ],
                        },
                        "$amount",
                        0,
                      ],
                    },
                  },
                  fundReceived: {
                    $sum: {
                      $cond: [
                        {
                          $and: [
                            { $eq: ["$to", "$$branchId"] },
                            { $eq: ["$type", "fund_transfer"] },
                          ],
                        },
                        "$amount",
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: "funds",
          },
        },
        {
          $lookup: {
            from: "sales",
            localField: "_id",
            foreignField: "branch",
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: date, $lt: date.addDays(1) },
                },
              },
              {
                $group: {
                  _id: null,
                  totalSale: {
                    $sum: "$netAmount",
                  },
                },
              },
            ],
            as: "sales",
          },
        },
        {
          $lookup: {
            from: "expenses",
            localField: "_id",
            foreignField: "branch",
            pipeline: [
              {
                $match: {
                  createdAt: { $gte: date, $lt: date.addDays(1) },
                },
              },
              {
                $group: {
                  _id: null,
                  totalExpense: {
                    $sum: "$amount",
                  },
                },
              },
            ],
            as: "expenses",
          },
        },
        {
          $lookup: {
            from: "funds",
            let: { branchId: "$_id" },
            pipeline: [
              {
                $match: {
                  $or: [
                    { $expr: { $eq: ["$from", "$$branchId"] } },
                    { $expr: { $eq: ["$to", "$$branchId"] } },
                  ],
                  $and: [
                    { createdAt: { $gte: date.subDays(1), $lt: date } },
                    { type: "closing_balance" },
                  ],
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: "prevClosingBalance",
          },
        },
        {
          $addFields: {
            funds: { $first: "$funds" },
            sales: { $first: "$sales" },
            expenses: { $first: "$expenses" },
            prevClosingBalance: { $first: "$prevClosingBalance" },
          },
        },
        {
          $addFields: {
            fundRequested: { $ifNull: ["$funds.fundRequested", 0] },
            fundTransferred: { $ifNull: ["$funds.fundTransferred", 0] },
            fundReceived: { $ifNull: ["$funds.fundReceived", 0] },
            totalSale: { $ifNull: ["$sales.totalSale", 0] },
            totalExpense: { $ifNull: ["$expenses.totalExpense", 0] },
            prevClosingBalance: { $ifNull: ["$prevClosingBalance.amount", 0] },
          },
        },
        {
          $addFields: {
            openingBalance: "$prevClosingBalance",
            closingBalance: {
              $sum: [
                {
                  $subtract: [
                    {
                      $subtract: ["$fundRequested", "$fundTransferred"],
                    },
                    {
                      $subtract: ["$totalSale", "$totalExpense"],
                    },
                  ],
                },
                { $sum: ["$fundReceived", "$prevClosingBalance"] },
              ],
            },
          },
        },
        {
          $project: {
            branchId: 1,
            branchName: 1,
            fundRequested: 1,
            fundTransferred: 1,
            fundReceived: 1,
            totalSale: 1,
            totalExpense: 1,
            openingBalance: 1,
            closingBalance: 1,
            date: date,
          },
        },
        { $sort: { createdAt: -1 } },
      ]).exec();
      data.push(...tmp);
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function calculateClosingBalance(query = {}) {
  try {
    Date.prototype.addDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() + days);
      return date;
    };

    Date.prototype.subDays = function (days) {
      var date = new Date(this.valueOf());
      date.setDate(date.getDate() - days);
      return date;
    };

    let date = new Date();
    date.setUTCHours(0, 0, 0, 0);

    if (query.date) {
      date = new Date(
        new Date(query.date).toISOString().replace(/T.*Z/, "T00:00:00Z")
      );
      delete query.date;
    }
    if (query.branch) {
      query._id = new mongoose.Types.ObjectId(query.branch);
      delete query.branch;
    } else {
      delete query.branch;
      throw new Error("Branch is required");
    }

    let data = await Branch.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "funds",
          let: { branchId: "$_id" },
          pipeline: [
            {
              $match: {
                $or: [
                  { $expr: { $eq: ["$from", "$$branchId"] } },
                  { $expr: { $eq: ["$to", "$$branchId"] } },
                ],
                createdAt: { $gte: date, $lt: date.addDays(1) },
              },
            },
            {
              $group: {
                _id: null,
                fundRequested: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$from", "$$branchId"] },
                          { $eq: ["$type", "fund_request"] },
                        ],
                      },
                      "$amount",
                      0,
                    ],
                  },
                },
                fundTransferred: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$from", "$$branchId"] },
                          { $eq: ["$type", "fund_transfer"] },
                        ],
                      },
                      "$amount",
                      0,
                    ],
                  },
                },
                fundReceived: {
                  $sum: {
                    $cond: [
                      {
                        $and: [
                          { $eq: ["$to", "$$branchId"] },
                          { $eq: ["$type", "fund_transfer"] },
                        ],
                      },
                      "$amount",
                      0,
                    ],
                  },
                },
              },
            },
          ],
          as: "funds",
        },
      },
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "branch",
          pipeline: [
            {
              $match: {
                createdAt: { $gte: date, $lt: date.addDays(1) },
              },
            },
            {
              $group: {
                _id: null,
                totalSale: {
                  $sum: "$netAmount",
                },
              },
            },
          ],
          as: "sales",
        },
      },
      {
        $lookup: {
          from: "expenses",
          localField: "_id",
          foreignField: "branch",
          pipeline: [
            {
              $match: {
                createdAt: { $gte: date, $lt: date.addDays(1) },
              },
            },
            {
              $group: {
                _id: null,
                totalExpense: {
                  $sum: "$amount",
                },
              },
            },
          ],
          as: "expenses",
        },
      },
      {
        $lookup: {
          from: "funds",
          let: { branchId: "$_id" },
          pipeline: [
            {
              $match: {
                $or: [
                  { $expr: { $eq: ["$from", "$$branchId"] } },
                  { $expr: { $eq: ["$to", "$$branchId"] } },
                ],
                $and: [
                  { createdAt: { $gte: date.subDays(1), $lt: date } },
                  { type: "closing_balance" },
                ],
              },
            },
            { $sort: { createdAt: -1 } },
            { $limit: 1 },
          ],
          as: "prevClosingBalance",
        },
      },
      {
        $addFields: {
          funds: { $first: "$funds" },
          sales: { $first: "$sales" },
          expenses: { $first: "$expenses" },
          prevClosingBalance: { $first: "$prevClosingBalance" },
        },
      },
      {
        $addFields: {
          fundRequested: { $ifNull: ["$funds.fundRequested", 0] },
          fundTransferred: { $ifNull: ["$funds.fundTransferred", 0] },
          fundReceived: { $ifNull: ["$funds.fundReceived", 0] },
          totalSale: { $ifNull: ["$sales.totalSale", 0] },
          totalExpense: { $ifNull: ["$expenses.totalExpense", 0] },
          prevClosingBalance: { $ifNull: ["$prevClosingBalance.amount", 0] },
        },
      },
      {
        $addFields: {
          openingBalance: "$prevClosingBalance",
          closingBalance: {
            $sum: [
              {
                $subtract: [
                  {
                    $subtract: ["$fundRequested", "$fundTransferred"],
                  },
                  {
                    $subtract: ["$totalSale", "$totalExpense"],
                  },
                ],
              },
              { $sum: ["$fundReceived", "$prevClosingBalance"] },
            ],
          },
        },
      },
      {
        $project: {
          branchId: 1,
          branchName: 1,
          fundRequested: 1,
          fundTransferred: 1,
          fundReceived: 1,
          totalSale: 1,
          totalExpense: 1,
          openingBalance: 1,
          closingBalance: 1,
          date: date,
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();

    if (data.length) {
      await Fund.create({
        from: query._id,
        to: query._id,
        amount: data[0].closingBalance,
        type: "closing_balance",
        note: "Cloasing balance",
        status: "approved",
        createdAt: date,
      });
    }

    return {};
  } catch (err) {
    throw err;
  }
}

module.exports = { find, calculateClosingBalance };
