const SupportReply = require("../models/support-reply");
const mongoose = require("mongoose");

async function find(query = {}) {
  try {
    if (query.support && typeof query.support == "string") {
      query.support = new mongoose.Types.ObjectId(query.support);
    }
    return await SupportReply.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "supports",
          localField: "support",
          foreignField: "_id",
          as: "support",
        },
      },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "attachments",
        },
      },
      {
        $addFields: {
          support: { $first: "$support" },
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
    const data = await SupportReply.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "supports",
          localField: "support",
          foreignField: "_id",
          as: "support",
        },
      },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "attachments",
        },
      },
      {
        $addFields: {
          support: { $first: "$support" },
        },
      },
      { $limit: 1 },
    ]).exec();
    return data[0] ?? {};
  } catch (err) {
    throw err;
  }
}

async function aggregate(query = {}) {
  try {
    return await SupportReply.aggregate(query).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new SupportReply(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await SupportReply.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    if (id) {
      return await SupportReply.deleteMany({
        _id: {
          $in: id.split(","),
        },
      }).exec();
    }
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  aggregate,
  create,
  update,
  remove,
};
