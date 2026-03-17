const Release = require("../models/release");
const mongoose = require("mongoose");

async function find(query = {}) {
  try {
    let filter = {};
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
    if (query.phoneNumber) {
      filter["customer.phoneNumber"] = query.phoneNumber;
      delete query.phoneNumber;
    } else {
      delete query.phoneNumber;
    }
    if (query.customer) {
      query.customer = new mongoose.Types.ObjectId(query.customer);
    } else {
      delete query.customer;
    }
    return await Release.aggregate([
      {
        $match: query,
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
    return await Release.findById(id).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new Release(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Release.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Release.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, update, remove };
