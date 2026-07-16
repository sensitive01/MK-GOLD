const Lead = require("../models/lead");
const FileUpload = require("../models/fileupload");
const mongoose = require("mongoose");

async function find(query = {}, user = null) {
  try {
    const userType = user?.userType?.toLowerCase();
    if (
      userType === "branch" ||
      userType === "assistant_branch_manager" ||
      userType === "branch_executive"
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
    if (data.mobile && data.date) {
      const existing = await Lead.findOne({
        mobile: data.mobile,
        date: new Date(data.date)
      }).lean();
      if (existing) {
        throw new Error("A lead with this mobile number already exists for this date.");
      }
    }
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
    const update = { $push: { dispositions: payload } };
    if ((payload.status === "Branch Visit Confirmed" || payload.status === "Planning to Visit") && payload.branch) {
      update.$set = { branch: payload.branch };
    }
    return await Lead.findByIdAndUpdate(
      id,
      update,
      { new: true }
    ).exec();
  } catch (err) {
    throw err;
  }
}

async function getLeadStats(user = null) {
  try {
    const query = {};
    const userType = user?.userType?.toLowerCase();
    if (
      userType === "branch" ||
      userType === "assistant_branch_manager" ||
      userType === "branch_executive"
    ) {
      const branchId = user.branch?._id || user.branch;
      if (branchId) {
        query.branch = branchId;
      } else {
        // If user has no branch, look for leads with no branch
        query.branch = { $in: [null, undefined] };
      }
    } else if (userType === "telecalling") {
      query.leadSource = { $in: ["telecalling", "marketing"] };
    } else if (userType === "marketing") {
      query.leadSource = "marketing";
    }

    const totalLeads = await Lead.countDocuments(query);
    const pendingLeads = await Lead.countDocuments({ ...query, status: "pending" });

    console.log('Lead Stats Query:', query);
    console.log('Stats Result:', { totalLeads, pendingLeads });

    return { totalLeads, pendingLeads };
  } catch (err) {
    throw err;
  }
}
async function bulkCreate(leadsArray) {
  try {
    if (!leadsArray || leadsArray.length === 0) return { insertedCount: 0, duplicateCount: 0, insertedLeads: [] };

    const mobiles = leadsArray.map(l => l.mobile);
    const dates = leadsArray.map(l => new Date(l.date));

    const existingLeads = await Lead.find({
      mobile: { $in: mobiles },
      date: { $in: dates }
    }, { mobile: 1, date: 1 }).lean();

    const existingSet = new Set(
      existingLeads.map(l => `${l.mobile}_${l.date.toISOString()}`)
    );

    const uniqueLeads = [];
    const currentSet = new Set();
    let duplicateCount = 0;

    for (const lead of leadsArray) {
      const key = `${lead.mobile}_${new Date(lead.date).toISOString()}`;
      if (!existingSet.has(key) && !currentSet.has(key)) {
        uniqueLeads.push(lead);
        currentSet.add(key);
      } else {
        duplicateCount++;
      }
    }

    if (uniqueLeads.length > 0) {
      await Lead.insertMany(uniqueLeads);
    }
    
    return { insertedCount: uniqueLeads.length, duplicateCount, insertedLeads: uniqueLeads };
  } catch (err) {
    throw err;
  }
}

async function markExclusive(ids, isExclusive) {
  try {
    const idArray = Array.isArray(ids) ? ids : ids.split(",");
    return await Lead.updateMany(
      { _id: { $in: idArray } },
      { $set: { isExclusive: isExclusive } }
    );
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, bulkCreate, update, remove, addDisposition, getLeadStats, markExclusive };
