const NotificationManagement = require("../models/notificationManagement");
const FileUpload = require("../models/fileupload");
const mongoose = require("mongoose");

async function find(query = {}) {
  try {
    return await NotificationManagement.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "file",
        },
      },
      {
        $addFields: {
          file: { $first: "$file" },
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
    const data = await NotificationManagement.findById(id).lean();
    if (data) {
      data.file = await FileUpload.findOne({
        uploadId: id,
        uploadName: "notification",
      }).lean();
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function create(data) {
  try {
    return await NotificationManagement.create(data);
  } catch (err) {
    throw err;
  }
}

async function update(id, data) {
  try {
    return await NotificationManagement.findByIdAndUpdate(id, data, { new: true });
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    if (id.includes(",")) {
      return await NotificationManagement.deleteMany({ _id: { $in: id.split(",") } });
    }
    return await NotificationManagement.findByIdAndDelete(id);
  } catch (err) {
    throw err;
  }
}

async function markAsSeen(id, userId) {
  try {
    return await NotificationManagement.findByIdAndUpdate(
      id,
      { $addToSet: { seenBy: userId } },
      { new: true }
    );
  } catch (err) {
    throw err;
  }
}

async function getActiveForUser(user) {
  try {
    const now = new Date();
    const originalRoleStr = Array.isArray(user?.userType)
      ? user.userType.join(",")
      : user?.userType || "";
    const cleanRole = originalRoleStr.toLowerCase().trim();
    const normalizedRole = cleanRole.replace(/[-\s]+/g, "_");
    const possibleRoles = ["all", cleanRole, normalizedRole];

    if (normalizedRole.includes("branch")) {
      possibleRoles.push("branch");
      if (normalizedRole.includes("assistant") || normalizedRole.includes("asst")) {
        possibleRoles.push("assistant_branch_manager");
      }
      if (normalizedRole.includes("executive")) {
        possibleRoles.push("branch_executive");
      }
    }
    if (normalizedRole.includes("transaction")) {
      possibleRoles.push("transaction_executive", "branch");
    }
    if (normalizedRole.includes("bullion")) {
      possibleRoles.push("bullion_desk", "bullion");
    }

    const matchQuery = {
      isActive: true,
      $or: [
        { targetRoles: "all" },
        { targetRoles: { $in: possibleRoles } },
      ],
      $and: [
        {
          $or: [
            { expiryDate: { $exists: false } },
            { expiryDate: null },
            { expiryDate: { $gte: now } },
          ],
        },
      ],
    };

    if (user?._id) {
      matchQuery.$or.push({ targetUser: new mongoose.Types.ObjectId(user._id) });
    }



    const notifications = await NotificationManagement.aggregate([
      { $match: matchQuery },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "file",
        },
      },
      {
        $addFields: {
          isSeen: user?._id
            ? { $in: [new mongoose.Types.ObjectId(user._id), "$seenBy"] }
            : false,
          file: { $first: "$file" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();

    return notifications;
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  create,
  update,
  remove,
  markAsSeen,
  getActiveForUser,
};

