const Expense = require("../models/expense");

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
    
    // Convert string IDs to ObjectIds for aggregation
    if (query.branch && typeof query.branch === 'string') {
      const mongoose = require("mongoose");
      query.branch = new mongoose.Types.ObjectId(query.branch);
    }
    if (query._id && typeof query._id === 'string') {
      const mongoose = require("mongoose");
      query._id = new mongoose.Types.ObjectId(query._id);
    }

    return await Expense.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "fileuploads",
          let: { expenseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { 
                      $eq: [
                        { $toObjectId: "$uploadId" }, 
                        "$$expenseId"
                      ] 
                    },
                    { $eq: ["$uploadName", "expense"] }
                  ]
                }
              }
            }
          ],
          as: "attachments",
        },
      },
      {
        $addFields: {
          imageLink: { $arrayElemAt: ["$attachments.uploadedFile", 0] }
        }
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    const mongoose = require("mongoose");
    const results = await Expense.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "branches",
          localField: "branch",
          foreignField: "_id",
          as: "branch",
        },
      },
      { $unwind: { path: "$branch", preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: "fileuploads",
          let: { expenseId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { 
                      $eq: [
                        { $toObjectId: "$uploadId" }, 
                        "$$expenseId"
                      ] 
                    },
                    { $eq: ["$uploadName", "expense"] }
                  ]
                }
              }
            }
          ],
          as: "attachments",
        },
      },
      {
        $addFields: {
          imageLink: { $arrayElemAt: ["$attachments.uploadedFile", 0] }
        }
      },
    ]).exec();
    return results[0] || null;
  } catch (err) {
    throw err;
  }
}

async function aggregate(query = {}) {
  try {
    return await Expense.aggregate(query).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new Expense(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Expense.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Expense.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, aggregate, create, update, remove };
