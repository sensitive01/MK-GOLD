const mongoose = require("mongoose");
const Sale = require("../models/sales");

async function find(query = {}) {
  try {
    let and = [];
    if (query.createdAt && "$gte" in query.createdAt) {
      and.push({
        createdAt: {
          $gte: new Date(new Date(query.createdAt["$gte"]).toISOString().replace(/T.*Z/, "T00:00:00Z")),
        },
      });
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      and.push({
        createdAt: {
          $lte: new Date(new Date(query.createdAt["$lte"]).toISOString().replace(/T.*Z/, "T23:59:59Z")),
        },
      });
    }
    if (query.branch) {
      and.push({
        "branch._id": {
          $eq:
            query.branch instanceof mongoose.Types.ObjectId
              ? query.branch
              : new mongoose.Types.ObjectId(query.branch),
        },
      });
    } else {
      delete query.branch;
    }
    if (query.status) {
      and.push({
        "ornaments.status": { $eq: query.status },
      });
      delete query.status;
    } else {
      delete query.status;
    }
    if (query.movedAt) {
      and.push({
        "ornaments.movedAt": { $eq: new Date(query.movedAt) },
      });
      delete query.movedAt;
    } else {
      delete query.movedAt;
    }

    if (and.length > 0) {
      query = {
        $and: and,
      };
    } else {
      query = {};
    }

    return await Sale.aggregate([
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: "$ornaments",
      },
      {
        $addFields: {
          branch: { $first: "$branch" },
          movedAt: "$ornaments.movedAt",
        },
      },
      {
        $match: query,
      },
      {
        $project: {
          _id: "$ornaments._id",
          branchId: "$branch.branchId",
          branchName: "$branch.branchName",
          ornamentType: "$ornaments.ornamentType",
          quantity: "$ornaments.quantity",
          grossWeight: "$ornaments.grossWeight",
          stoneWeight: "$ornaments.stoneWeight",
          netWeight: "$ornaments.netWeight",
          purity: "$ornaments.purity",
          netAmount: "$ornaments.netAmount",
          status: "$ornaments.status",
          movedAt: 1,
          branch: "$branch",
          billDate: "$createdAt",
        },
      },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function getLatestPrint(query = {}) {
  try {
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    let latest = await Sale.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: "$ornaments",
      },
      {
        $addFields: {
          branch: { $first: "$branch" },
          movedAt: "$ornaments.movedAt",
        },
      },
      { $sort: { movedAt: -1 } },
      { $limit: 1 },
    ]).exec();

    if (latest.length == 0) {
      throw new Error("No data found");
    }

    return await find({
      branch: latest[0].branch?._id,
      status: latest[0].ornaments.status,
      movedAt: latest[0].movedAt,
    });
  } catch (err) {
    throw err;
  }
}

async function groupByBranchAndMovedAt(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"]).toISOString().replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"]).toISOString().replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    if (query.movedAt) {
      query["ornaments.movedAt"] = { $eq: new Date(query.movedAt) };
      delete query.movedAt;
    } else {
      delete query.movedAt;
    }
    if (query.status) {
      query["ornaments.status"] = query.status;
      delete query.status;
    } else {
      delete query.status;
    }
    return await Sale.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $unwind: "$ornaments",
      },
      {
        $addFields: {
          branch: { $first: "$branch" },
        },
      },
      {
        $group: {
          _id: {
            movedAt: "$ornaments.movedAt",
            branch: "$branch._id",
            branchId: "$branch.branchId",
            branchName: "$branch.branchName",
            status: "$ornaments.status",
          },
          count: { $count: {} },
          quantity: { $sum: "$ornaments.quantity" },
          grossWeight: { $sum: "$ornaments.grossWeight" },
          stoneWeight: { $sum: "$ornaments.stoneWeight" },
          netWeight: { $sum: "$ornaments.netWeight" },
          netAmount: { $sum: "$ornaments.netAmount" },
          ids: { $push: "$ornaments._id" },
        },
      },
      {
        $project: {
          _id: 0,
          movedAt: "$_id.movedAt",
          branch: "$_id.branch",
          branchId: "$_id.branchId",
          branchName: "$_id.branchName",
          status: "$_id.status",
          count: 1,
          quantity: 1,
          grossWeight: 1,
          stoneWeight: 1,
          netWeight: 1,
          netAmount: 1,
          ids: 1,
        },
      },
      { $sort: { movedAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function update(payload) {
  try {
    let data = {};
    let query = {};
    if (payload.status) {
      data["ornaments.$.status"] = payload.status;
      if (payload.status.toLowerCase() === "moved") {
        data["ornaments.$.movedAt"] = new Date();
      }
    }
    if (payload.id) {
      if (Array.isArray(payload.id)) {
        payload.id.map(async (id) => {
          await Sale.updateMany(
            {
              "ornaments._id": new mongoose.Types.ObjectId(id),
            },
            { $set: data },
            {
              returnDocument: "after",
            }
          ).exec();
        });
        return {};
      } else {
        query["ornaments._id"] = new mongoose.Types.ObjectId(payload.id);
      }
    } else {
      throw new Error("Id is required");
    }
    return await Sale.updateMany(
      query,
      { $set: data },
      {
        returnDocument: "after",
      }
    ).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, update, groupByBranchAndMovedAt, getLatestPrint };
