const Lead = require("../models/lead");
const Counter = require("../models/counter");
const FileUpload = require("../models/fileupload");
const mongoose = require("mongoose");
const Customer = require("../models/customer");
const Sales = require("../models/sales");
const GoldRate = require("../models/goldrate");

async function find(query = {}, user = null) {
  try {
    const userType = user?.userType?.toLowerCase();
    if (
      userType === "branch" ||
      userType === "assistant_branch_manager" ||
      userType === "branch_executive" ||
      userType === "transaction_executive"
    ) {
      const branchId = user.branch?._id || user.branch;
      const branchOrCondition = [
        { assignedExecutive: user._id },
        ...(branchId ? [{ branch: branchId, assignedExecutive: { $in: [null, undefined] } }] : [])
      ];
      if (query.$or) {
        query.$and = [
          { $or: query.$or },
          { $or: branchOrCondition }
        ];
        delete query.$or;
      } else {
        query.$or = branchOrCondition;
      }
    } else if (userType === "telecalling") {
      // Telecallers only see unclaimed leads, or leads they have specifically claimed
      query.$or = [
        { assignedTo: null },
        { assignedTo: { $exists: false } },
        { assignedTo: user._id }
      ];
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

    const docs = await Lead.aggregate([
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
    
    const User = require("../models/user");
    const Employee = require("../models/employee");
    const Branch = require("../models/branch");
    await User.populate(docs, { path: "updatedBy", select: "username employee" });
    await Employee.populate(docs, { path: "updatedBy.employee", select: "name" });
    await Branch.populate(docs, { path: "branch", select: "branchName" });
    await User.populate(docs, { path: "assignedExecutive", select: "username employee userType" });
    await Employee.populate(docs, { path: "assignedExecutive.employee", select: "name employeeId phoneNumber designation" });
    await User.populate(docs, { path: "movedToBusinessBy", select: "username employee" });
    await Employee.populate(docs, { path: "movedToBusinessBy.employee", select: "name employeeId" });
    await User.populate(docs, { path: "tlApprovedBy", select: "username employee" });
    await Employee.populate(docs, { path: "tlApprovedBy.employee", select: "name employeeId" });
    
    return docs;
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    const data = await Lead.findById(id)
      .populate("branch", "branchName")
      .populate({
        path: "assignedExecutive",
        select: "username employee userType",
        populate: { path: "employee", select: "name employeeId phoneNumber designation" },
      })
      .populate({
        path: "dispositions.createdBy",
        populate: { path: "employee" },
      })
      .populate({
        path: "movedToBusinessBy",
        select: "username employee",
        populate: { path: "employee", select: "name employeeId" },
      })
      .populate({
        path: "tlApprovedBy",
        select: "username employee",
        populate: { path: "employee", select: "name employeeId" },
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

async function moveToBusiness(id, user = null) {
  try {
    const update = {
      isMovedToBusiness: true,
      movedToBusinessAt: new Date(),
    };
    if (user) {
      update.movedToBusinessBy = user._id;
      update.updatedBy = user._id;
    }
    const lead = await Lead.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("movedToBusinessBy", "username employee")
      .populate({ path: "movedToBusinessBy", populate: { path: "employee", select: "name employeeId" } })
      .populate({ path: "updatedBy", select: "username employee", populate: { path: "employee", select: "name" } })
      .lean();

    return lead;
  } catch (err) {
    throw err;
  }
}

async function tlApprove(id, user = null) {
  try {
    const update = {
      tlStatus: "approved",
      isMovedToBullionDesk: true,
      tlApprovedAt: new Date(),
    };
    if (user) {
      update.tlApprovedBy = user._id;
      update.updatedBy = user._id;
    }
    const lead = await Lead.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("movedToBusinessBy", "username employee")
      .populate({ path: "movedToBusinessBy", populate: { path: "employee", select: "name employeeId" } })
      .populate("tlApprovedBy", "username employee")
      .populate({ path: "tlApprovedBy", populate: { path: "employee", select: "name employeeId" } })
      .populate({ path: "updatedBy", select: "username employee", populate: { path: "employee", select: "name" } })
      .lean();

    return lead;
  } catch (err) {
    throw err;
  }
}

async function tlReject(id, reason = "", user = null) {
  try {
    const update = {
      tlStatus: "rejected",
      tlRejectionReason: reason,
      isMovedToBullionDesk: false,
      status: "rejected",
    };
    if (user) {
      update.tlApprovedBy = user._id;
      update.updatedBy = user._id;
    }
    const lead = await Lead.findByIdAndUpdate(
      id,
      { $set: update },
      { new: true }
    )
      .populate("movedToBusinessBy", "username employee")
      .populate({ path: "movedToBusinessBy", populate: { path: "employee", select: "name employeeId" } })
      .populate("tlApprovedBy", "username employee")
      .populate({ path: "tlApprovedBy", populate: { path: "employee", select: "name employeeId" } })
      .populate({ path: "updatedBy", select: "username employee", populate: { path: "employee", select: "name" } })
      .lean();

    return lead;
  } catch (err) {
    throw err;
  }
}

async function getNextTelecaller() {
  try {
    const User = require("../models/user");

    // Fetch active telecallers sorted by _id for a stable, consistent order
    const telecallers = await User.find({ userType: "telecalling", status: "active" })
      .select("_id")
      .sort({ _id: 1 })
      .lean();

    if (!telecallers || telecallers.length === 0) return null;

    // Atomically increment the round-robin counter and return the new value.
    // findOneAndUpdate with upsert ensures the doc is created on first use.
    const counter = await Counter.findOneAndUpdate(
      { key: "telecaller_rr" },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    // Wrap around using modulo so index stays within bounds:
    //   counter 1 → index 0 (TC1)
    //   counter 2 → index 1 (TC2)
    //   counter 5 → index 0 (TC1 again) for 4 telecallers
    const index = (counter.value - 1) % telecallers.length;
    return telecallers[index]._id;
  } catch (err) {
    console.error("Error in getNextTelecaller:", err);
    return null;
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

    if (!data.assignedTo) {
      const nextTelecallerId = await getNextTelecaller();
      if (nextTelecallerId) {
        data.assignedTo = nextTelecallerId;
      }
    }

    return await Lead.create(data);
  } catch (err) {
    throw err;
  }
}

async function update(id, data, user = null) {
  try {
    const lead = await Lead.findById(id);
    if (user) {
      if (user.userType?.toLowerCase() === 'telecalling' && !lead.assignedTo) {
        data.assignedTo = user._id;
      }
      data.updatedBy = user._id;
    }
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

async function addDisposition(id, payload, user = null) {
  try {
    const update = { $push: { dispositions: payload } };
    if ((payload.status === "Visited Branch" || payload.status === "Planning to Visit" || payload.status === "Business Closed") && payload.branch) {
      update.$set = { branch: payload.branch };
    }

    if (payload.status === "Business Closed" || payload.status === "Business Converted") {
      update.$set = update.$set || {};
      update.$set.status = "converted";
    }

    const rejectedStatuses = ["Wrong Enquiry", "Not Connected", "Not Feasible", "Sold outside"];
    if (rejectedStatuses.includes(payload.status)) {
      update.$set = update.$set || {};
      update.$set.status = "rejected";
    }

    if (user) {
      if (!update.$set) update.$set = {};
      update.$set.updatedBy = user._id;
      if (user.userType?.toLowerCase() === 'telecalling') {
        const lead = await Lead.findById(id);
        if (!lead.assignedTo) {
          update.$set.assignedTo = user._id;
        }
      }
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
      userType === "branch_executive" ||
      userType === "transaction_executive"
    ) {
      const branchId = user.branch?._id || user.branch;
      query.$or = [
        { assignedExecutive: user._id },
        ...(branchId ? [{ branch: branchId, assignedExecutive: { $in: [null, undefined] } }] : [])
      ];
    } else if (userType === "telecalling") {
        query.leadSource = { $in: ["telecalling", "marketing"] };
        query.$or = [
          { assignedTo: null },
          { assignedTo: { $exists: false } },
          { assignedTo: user._id }
        ];
      } else if (userType === "telecaller_tl" || userType === "telecaller-tl") {
        query.leadSource = { $in: ["telecalling", "marketing"] };
      } else if (userType === "marketing") {
      query.leadSource = "marketing";
    }

    const totalLeads = await Lead.countDocuments(query);
    const pendingLeads = await Lead.countDocuments({ ...query, status: "pending" });

    // Gold Rate & Silver Rate
    const goldRateDoc = await GoldRate.findOne({ type: "gold" }).sort({ createdAt: -1 });
    const silverRateDoc = await GoldRate.findOne({ type: "silver" }).sort({ createdAt: -1 });
    const goldRate = goldRateDoc?.rate || 0;
    const silverRate = silverRateDoc?.rate || 0;

    // Today's Followups
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysFollowups = await Lead.countDocuments({
      ...query,
      "dispositions.callbackDate": todayStr
    });

    // Business Converted this month
    let businessConverted = 0;
    if (user && user.userType?.toLowerCase() === "telecalling") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const endOfMonth = new Date();
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Get phone numbers of all leads matching this telecaller
      const leads = await Lead.find(query).select('mobile').lean();
      const mobiles = leads.map(l => l.mobile).filter(m => m);

      if (mobiles.length > 0) {
        // Find matching customer records by phone number
        const customers = await Customer.find({ phoneNumber: { $in: mobiles } }).select('_id').lean();
        const customerIds = customers.map(c => c._id);

        if (customerIds.length > 0) {
          // Count sales created this month for those customers
          businessConverted = await Sales.countDocuments({
            customer: { $in: customerIds },
            createdAt: { $gte: startOfMonth, $lte: endOfMonth }
          });
        }
      }
    }

    console.log('Lead Stats Query:', query);
    console.log('Stats Result:', { totalLeads, pendingLeads, goldRate, silverRate, todaysFollowups, businessConverted });

    return { totalLeads, pendingLeads, goldRate, silverRate, todaysFollowups, businessConverted };
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

    const User = require("../models/user");

    // Fetch active telecallers in a stable sorted order (same as getNextTelecaller)
    const telecallers = await User.find({ userType: "telecalling", status: "active" })
      .select("_id")
      .sort({ _id: 1 })
      .lean();

    const uniqueLeads = [];
    const currentSet = new Set();
    let duplicateCount = 0;

    for (const lead of leadsArray) {
      const key = `${lead.mobile}_${new Date(lead.date).toISOString()}`;
      if (!existingSet.has(key) && !currentSet.has(key)) {
        if (telecallers.length > 0) {
          // Use the same shared round-robin counter so bulk imports
          // continue seamlessly from wherever single-lead assignment left off
          const counter = await Counter.findOneAndUpdate(
            { key: "telecaller_rr" },
            { $inc: { value: 1 } },
            { new: true, upsert: true }
          );
          const index = (counter.value - 1) % telecallers.length;
          lead.assignedTo = telecallers[index]._id;
        }
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

async function markExclusive(ids, isExclusive, user = null) {
  try {
    const idArray = Array.isArray(ids) ? ids : ids.split(",");
    const updatePayload = { $set: { isExclusive: isExclusive } };

    return await Lead.updateMany(
      { _id: { $in: idArray } },
      updatePayload
    ).exec();
  } catch (err) {
    throw err;
  }
}

async function assignExecutive(id, payload, user = null) {
  try {
    const updateData = {};
    if (payload.branch) updateData.branch = payload.branch;
    if (payload.assignedExecutive) updateData.assignedExecutive = payload.assignedExecutive;
    if (payload.assignedExecutiveName) updateData.assignedExecutiveName = payload.assignedExecutiveName;
    if (user) updateData.updatedBy = user._id;

    return await Lead.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    )
      .populate("branch", "branchName")
      .populate({
        path: "assignedExecutive",
        select: "username employee userType",
        populate: { path: "employee", select: "name employeeId phoneNumber designation" },
      });
  } catch (err) {
    throw err;
  }
}

async function getBranchExecutives(branchId) {
  try {
    const User = require("../models/user");
    const mongoose = require("mongoose");
    const filter = {
      status: "active",
    };
    if (branchId) {
      filter.branch = new mongoose.Types.ObjectId(branchId);
    }
    const users = await User.find(filter)
      .populate("employee", "name employeeId phoneNumber designation")
      .select("_id username userType employee branch")
      .lean();

    return users.map((u) => ({
      _id: u._id,
      username: u.username,
      userType: u.userType,
      employeeId: u.employee?._id,
      name: u.employee?.name || u.username,
      employeeCode: u.employee?.employeeId,
      designation: u.employee?.designation,
      phoneNumber: u.employee?.phoneNumber,
    }));
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  create,
  bulkCreate,
  update,
  remove,
  addDisposition,
  getLeadStats,
  markExclusive,
  getNextTelecaller,
  assignExecutive,
  getBranchExecutives,
  moveToBusiness,
  tlApprove,
  tlReject,
};
