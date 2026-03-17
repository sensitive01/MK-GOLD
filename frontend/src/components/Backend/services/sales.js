const Sales = require("../models/sales");
const mongoose = require("mongoose");

async function find(query = {}) {
  try {
    let filter = {};
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    if (query.phoneNumber) {
      filter["customer.phoneNumber"] = query.phoneNumber;
      delete query.phoneNumber;
    } else {
      delete query.phoneNumber;
    }
    if (query.branchName) {
      filter["branch.branchName"] = query.branchName;
      delete query.branchName;
    } else {
      delete query.branchName;
    }
    if (query.customer) {
      query.customer = new mongoose.Types.ObjectId(query.customer);
    } else {
      delete query.customer;
    }
    return await Sales.aggregate([
      {
        $match: query,
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "bank",
          let: { bankId: "$bank" },
          pipeline: [
            { $unwind: "$bank" },
            { $match: { $expr: { $eq: ["$bank._id", "$$bankId"] } } },
            { $replaceRoot: { newRoot: "$bank" } },
          ],
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "fileuploads",
                localField: "_id",
                foreignField: "uploadId",
                as: "profileImage",
              },
            },
            {
              $addFields: {
                profileImage: { $first: "$profileImage" },
              },
            },
          ],
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
        },
      },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "proof",
        },
      },
      {
        $addFields: {
          branch: { $first: "$branch" },
          customer: { $first: "$customer" },
          bank: { $first: "$bank" },
        },
      },
      {
        $match: filter,
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    const sales = await Sales.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "bank",
          let: { bankId: "$bank" },
          pipeline: [
            { $unwind: "$bank" },
            { $match: { $expr: { $eq: ["$bank._id", "$$bankId"] } } },
            { $replaceRoot: { newRoot: "$bank" } },
          ],
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          pipeline: [
            {
              $lookup: {
                from: "fileuploads",
                localField: "_id",
                foreignField: "uploadId",
                as: "profileImage",
              },
            },
            {
              $addFields: {
                profileImage: { $first: "$profileImage" },
              },
            },
          ],
          as: "customer",
        },
      },
      {
        $lookup: {
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
        },
      },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "proof",
        },
      },
      {
        $addFields: {
          branch: { $first: "$branch" },
          customer: { $first: "$customer" },
          bank: { $first: "$bank" },
        },
      },
      { $limit: 1 },
    ]).exec();
    return sales[0];
  } catch (err) {
    throw err;
  }
}

async function count(query = {}) {
  try {
    if (query.createdAt) {
      query.createdAt = new Date(query.createdAt).toISOString();
      query.createdAt = {
        $gte: new Date(query.createdAt.replace(/T.*Z/, "T00:00:00Z")),
        $lte: new Date(query.createdAt.replace(/T.*Z/, "T23:59:59Z")),
      };
    }
    return await Sales.count(query);
  } catch (err) {
    throw err;
  }
}

async function aggregate(query = {}) {
  try {
    return await Sales.aggregate(query).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    payload.billId = Math.floor(100000 + Math.random() * 900000);
    let sale = new Sales(payload);
    return await sale.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Sales.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Sales.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function branchConsolidatedSaleReport(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    return await Sales.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
        },
      },
      {
        $addFields: {
          rate: {
            $cond: {
              if: { $eq: ["$purchaseType", "gold"] },
              then: "$goldRate",
              else: "$silverRate",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            purchaseType: "$purchaseType",
            saleType: "$saleType",
          },
          grossWeight: { $sum: "$grossWeight" },
          netWeight: { $sum: "$netWeight" },
          netAmount: { $sum: "$netAmount" },
          payableAmount: { $sum: "$payableAmount" },
          bills: { $count: {} },
          ornaments: { $sum: { $size: "$ornaments" } },
          rate: { $first: "$rate" },
          releaseAmount: {
            $sum: {
              $reduce: {
                input: "$release",
                initialValue: 0,
                in: { $sum: ["$$value", "$$this.payableAmount"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          type: "$_id.purchaseType",
          saleType: "$_id.saleType",
          grossWeight: 1,
          grossWeight: 1,
          netWeight: 1,
          netAmount: 1,
          payableAmount: 1,
          releaseAmount: 1,
          bills: 1,
          ornaments: 1,
          rate: 1,
        },
      },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function adminConsolidatedSaleReport(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    return await Sales.aggregate([
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
        $lookup: {
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
        },
      },
      {
        $addFields: {
          rate: {
            $cond: {
              if: { $eq: ["$purchaseType", "gold"] },
              then: "$goldRate",
              else: "$silverRate",
            },
          },
          branch: { $first: "$branch" },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            purchaseType: "$purchaseType",
            branch: "$branch.branchId",
            saleType: "$saleType",
          },
          grossWeight: { $sum: "$grossWeight" },
          netWeight: { $sum: "$netWeight" },
          netAmount: { $sum: "$netAmount" },
          payableAmount: { $sum: "$payableAmount" },
          bills: { $count: {} },
          ornaments: { $sum: { $size: "$ornaments" } },
          rate: { $first: "$rate" },
          branch: { $first: "$branch.branchName" },
          releaseAmount: {
            $sum: {
              $reduce: {
                input: "$release",
                initialValue: 0,
                in: { $sum: ["$$value", "$$this.payableAmount"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          type: "$_id.purchaseType",
          saleType: "$_id.saleType",
          grossWeight: 1,
          netWeight: 1,
          netAmount: 1,
          payableAmount: 1,
          releaseAmount: 1,
          bills: 1,
          ornaments: 1,
          rate: 1,
          branch: 1,
        },
      },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  count,
  aggregate,
  create,
  update,
  remove,
  branchConsolidatedSaleReport,
  adminConsolidatedSaleReport,
};
