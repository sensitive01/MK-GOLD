const Release = require("../models/release");
const Sales = require("../models/sales");
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
          // Convert actionLog performer IDs to ObjectIds for lookup
          actionLog: {
            $map: {
              input: { $ifNull: ["$actionLog", []] },
              as: "log",
              in: {
                action: "$$log.action",
                performedAt: "$$log.performedAt",
                performedBy: { $toObjectId: "$$log.performedBy" }
              }
            }
          }
        },
      },
      // Resolve all performers from actionLog
      {
        $lookup: {
          from: "employees",
          let: { logIds: "$actionLog.performedBy" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$logIds"] } } }
          ],
          as: "_logEmployees",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { logIds: "$actionLog.performedBy" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$logIds"] } } },
            {
              $lookup: {
                from: "employees",
                localField: "employee",
                foreignField: "_id",
                as: "employeeData"
              }
            },
            { $addFields: { employeeData: { $first: "$employeeData" } } }
          ],
          as: "_logUsers",
        },
      },
      {
        $addFields: {
          actionLog: {
            $map: {
              input: "$actionLog",
              as: "log",
              in: {
                action: "$$log.action",
                performedBy: "$$log.performedBy",
                performedAt: "$$log.performedAt",
                performerName: {
                  $let: {
                    vars: {
                      emp: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logEmployees", as: "e", cond: { $eq: ["$$e._id", "$$log.performedBy"] } } },
                          0,
                        ],
                      },
                      usr: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logUsers", as: "u", cond: { $eq: ["$$u._id", "$$log.performedBy"] } } },
                          0,
                        ],
                      },
                    },
                    in: {
                      $cond: {
                        if: "$$emp",
                        then: { name: "$$emp.name", employeeId: "$$emp.employeeId" },
                        else: { 
                          $cond: {
                            if: "$$usr",
                            then: { 
                              name: { $ifNull: ["$$usr.employeeData.name", { $ifNull: ["$$usr.username", "Staff"] }] }, 
                              employeeId: { $ifNull: ["$$usr.employeeData.employeeId", "ADMIN-USER"] } 
                            },
                            else: { name: "System", employeeId: "N/A" }
                          }
                        }
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          timeline: {
            $map: {
              input: "$actionLog",
              as: "log",
              in: {
                event: "$$log.action",
                performedBy: "$$log.performerName",
                performedAt: "$$log.performedAt",
              }
            }
          }
        }
      },
      {
        $project: {
          _logEmployees: 0,
          _logUsers: 0,
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
    const results = await Release.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
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
          as: "customer",
        },
      },
      {
        $addFields: {
          branch: { $first: "$branch" },
          customer: { $first: "$customer" },
          // Convert actionLog performer IDs to ObjectIds for lookup
          actionLog: {
            $map: {
              input: { $ifNull: ["$actionLog", []] },
              as: "log",
              in: {
                action: "$$log.action",
                performedAt: "$$log.performedAt",
                performedBy: { $toObjectId: "$$log.performedBy" }
              }
            }
          }
        },
      },
      // Resolve all performers from actionLog
      {
        $lookup: {
          from: "employees",
          let: { logIds: "$actionLog.performedBy" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$logIds"] } } }
          ],
          as: "_logEmployees",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { logIds: "$actionLog.performedBy" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$logIds"] } } },
            {
              $lookup: {
                from: "employees",
                localField: "employee",
                foreignField: "_id",
                as: "employeeData"
              }
            },
            { $addFields: { employeeData: { $first: "$employeeData" } } }
          ],
          as: "_logUsers",
        },
      },
      {
        $addFields: {
          actionLog: {
            $map: {
              input: "$actionLog",
              as: "log",
              in: {
                action: "$$log.action",
                performedBy: "$$log.performedBy",
                performedAt: "$$log.performedAt",
                performerName: {
                  $let: {
                    vars: {
                      emp: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logEmployees", as: "e", cond: { $eq: ["$$e._id", "$$log.performedBy"] } } },
                          0,
                        ],
                      },
                      usr: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logUsers", as: "u", cond: { $eq: ["$$u._id", "$$log.performedBy"] } } },
                          0,
                        ],
                      },
                    },
                    in: {
                      $cond: {
                        if: "$$emp",
                        then: { name: "$$emp.name", employeeId: "$$emp.employeeId" },
                        else: { 
                          $cond: {
                            if: "$$usr",
                            then: { 
                              name: { $ifNull: ["$$usr.employeeData.name", { $ifNull: ["$$usr.username", "Staff"] }] }, 
                              employeeId: { $ifNull: ["$$usr.employeeData.employeeId", "ADMIN-USER"] } 
                            },
                            else: { name: "System", employeeId: "N/A" }
                          }
                        }
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          timeline: {
            $map: {
              input: "$actionLog",
              as: "log",
              in: {
                event: "$$log.action",
                performedBy: "$$log.performerName",
                performedAt: "$$log.performedAt",
              }
            }
          }
        }
      },
      {
        $project: {
          _logEmployees: 0,
          _logUsers: 0,
        },
      },
      { $limit: 1 },
    ]).exec();
    return results[0];
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
    const updatedRelease = await Release.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();

    // Synchronize to Sales if status or completion flags are updated
    const syncData = {};
    if (payload.status !== undefined) syncData.status = payload.status;
    if (payload.financeCompleted !== undefined) syncData.financeCompleted = payload.financeCompleted;
    if (payload.assigneeCompleted !== undefined) syncData.assigneeCompleted = payload.assigneeCompleted;

    if (Object.keys(syncData).length > 0) {
      await Sales.updateMany(
        { release: id },
        { $set: syncData }
      ).exec();
    }

    return updatedRelease;
  } catch (err) {
    throw err;
  }
}

async function updateWithLog(id, setData, logEntry) {
  try {
    const updatedRelease = await Release.findByIdAndUpdate(
      id,
      {
        $set: setData,
        $push: { actionLog: logEntry },
      },
      { returnDocument: "after" }
    ).exec();

    // Synchronize to Sales if status or completion flags are updated
    if (updatedRelease && (setData.status !== undefined || setData.financeCompleted !== undefined || setData.assigneeCompleted !== undefined)) {
      const linkedSales = await Sales.find({ release: id }).exec();
      const salesService = require("./sales");
      for (const sale of linkedSales) {
        const syncData = {};
        if (setData.status !== undefined) syncData.status = setData.status;
        if (setData.financeCompleted !== undefined) syncData.financeCompleted = setData.financeCompleted;
        if (setData.assigneeCompleted !== undefined) syncData.assigneeCompleted = setData.assigneeCompleted;
        
        await salesService.updateWithLog(sale._id, syncData, logEntry);
      }
    }

    return updatedRelease;
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    const ids = id.split(",");
    
    // Remove references from Sales model
    await Sales.updateMany(
      { release: { $in: ids } },
      { $pull: { release: { $in: ids } } }
    ).exec();

    return await Release.deleteMany({
      _id: {
        $in: ids,
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = { find, findById, create, update, updateWithLog, remove };
