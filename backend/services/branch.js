const Branch = require("../models/branch");
const mongoose = require("mongoose");

async function getState(query = {}) {
  try {
    return await Branch.distinct("address.state").exec();
  } catch (err) {
    throw err;
  }
}

async function find(query = {}) {
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
    return await Branch.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "image",
        },
      },
      {
        $addFields: {
          image: { $first: "$image" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    const data = await Branch.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "image",
        },
      },
      {
        $addFields: {
          image: { $first: "$image" },
        },
      },
      { $limit: 1 },
    ]).exec();
    return data[0] ?? {};
  } catch (err) {
    throw err;
  }
}

async function findOne(query) {
  try {
    const data = await Branch.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "image",
        },
      },
      {
        $addFields: {
          image: { $first: "$image" },
        },
      },
      { $limit: 1 },
    ]).exec();
    return data[0] ?? {};
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new Branch(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Branch.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Branch.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function getNextBranchId() {
  try {
    let isUnique = false;
    let nextId = "";
    while (!isUnique) {
      const randomDigits = Math.floor(1000000 + Math.random() * 9000000).toString();
      nextId = "MKGBR" + randomDigits;
      const existingBranch = await Branch.findOne({ branchId: nextId }).exec();
      if (!existingBranch) {
        isUnique = true;
      }
    }
    return nextId;
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, findOne, getState, create, update, remove, getNextBranchId };
