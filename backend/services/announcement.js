const Announcement = require("../models/announcement");
const FileUpload = require("../models/fileupload");
const mongoose = require("mongoose");

async function find(query = {}) {
  try {
    return await Announcement.aggregate([
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
    const data = await Announcement.findById(id).lean();
    if (data) {
      data.file = await FileUpload.findOne({
        uploadId: id,
        uploadName: "announcement",
      }).lean();
    }
    return data;
  } catch (err) {
    throw err;
  }
}

async function create(data) {
  try {
    return await Announcement.create(data);
  } catch (err) {
    throw err;
  }
}

async function update(id, data) {
  try {
    return await Announcement.findByIdAndUpdate(id, data, { new: true });
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    if (id.includes(",")) {
      return await Announcement.deleteMany({ _id: { $in: id.split(",") } });
    }
    return await Announcement.findByIdAndDelete(id);
  } catch (err) {
    throw err;
  }
}

async function markAsSeen(id, userId) {
  try {
    return await Announcement.findByIdAndUpdate(
      id,
      { $addToSet: { seenBy: userId } },
      { new: true }
    ).exec();
  } catch (err) {
    throw err;
  }
}

async function findForUser(user) {
  try {
    const now = new Date();
    let userRole = user.userType.toLowerCase().replace("-", "").replace(" ", "_");
    if (userRole === "branch_manager") userRole = "branch";
    
    console.log(`DEBUG: Fetching announcements for user ${user._id}, role: ${userRole}`);

    const matchQuery = {
      isActive: true,
      $or: [
        { targetUser: new mongoose.Types.ObjectId(user._id) },
        { targetUserType: "all" },
        { targetUserType: { $in: ["all", userRole] } }
      ],
      $and: [
         { $or: [ { expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: now } } ] }
      ]
    };

    // Special logic for branch users to match broadly
    if (userRole.includes("branch")) {
       matchQuery.$or.push({ targetUserType: "branch" });
       matchQuery.$or.push({ targetUserType: "branch_manager" });
    }

    const announcements = await Announcement.aggregate([
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
          isSeen: { $in: [new mongoose.Types.ObjectId(user._id), "$seenBy"] },
          file: { $first: "$file" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
    
    return announcements;
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, update, remove, markAsSeen, findForUser };
