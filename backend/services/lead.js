const Lead = require("../models/lead");
const FileUpload = require("../models/fileupload");
const mongoose = require("mongoose");

async function find(query = {}, user = null) {
  try {
    const userType = user?.userType?.toLowerCase();
    if (
      userType === "branch" ||
      userType === "assistant_branch_manager" ||
      userType === "branch_executive" ||
      userType === "telecalling"
    ) {
      query.branch = user.branch?._id || user.branch;
    }

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

    return await Lead.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "lead",
        },
      },
      {
        $addFields: {
          lead: { $first: "$lead" },
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
    const data = await Lead.findById(id)
      .populate({
        path: "dispositions.createdBy",
        populate: { path: "employee" },
      })
      .lean();
    if (data) {
      data.lead = await FileUpload.findOne({
        uploadId: id,
        uploadName: "lead",
      }).lean();
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function create(data) {
  try {
    return await Lead.create(data);
  } catch (err) {
    throw err;
  }
}

async function update(id, data) {
  try {
    return await Lead.findByIdAndUpdate(id, data, { new: true });
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    if (id.includes(",")) {
      return await Lead.deleteMany({ _id: { $in: id.split(",") } });
    }
    return await Lead.findByIdAndDelete(id);
  } catch (err) {
    throw err;
  }
}

async function addDisposition(id, payload) {
  try {
    return await Lead.findByIdAndUpdate(
      id,
      {
        $push: { dispositions: payload },
      },
      { new: true }
    ).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, update, remove, addDisposition };
