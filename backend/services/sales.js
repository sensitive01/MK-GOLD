const Sales = require("../models/sales");
const Release = require("../models/release");
const mongoose = require("mongoose");

async function find(query = {}) {
  try {
    let filter = {};
    if (query.createdAt) {
      const dateFilter = { ...query.createdAt };
      if (dateFilter["$gte"]) {
        dateFilter["$gte"] = new Date(
          new Date(dateFilter["$gte"])
            .toISOString()
            .replace(/T.*Z/, "T00:00:00Z")
        );
      }
      if (dateFilter["$lte"]) {
        dateFilter["$lte"] = new Date(
          new Date(dateFilter["$lte"])
            .toISOString()
            .replace(/T.*Z/, "T23:59:59Z")
        );
      }
      delete query.createdAt;
      query.$or = [
        { createdAt: dateFilter },
        { status: { $ne: "completed" } },
      ];
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
    if (query.branchName) {
      filter["branch.branchName"] = query.branchName;
      delete query.branchName;
    } else {
      delete query.branchName;
    }
    if (query.customer) {
      query.customer = new mongoose.Types.ObjectId(query.customer);
    } else {
      delete query.customer;
    }
    const results = await Sales.aggregate([
      // ... (existing aggregation stages here)
      {
        $match: query,
      },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "bank",
          let: { bankId: "$bank" },
          pipeline: [
            { $unwind: "$bank" },
            { $match: { $expr: { $eq: ["$bank._id", "$$bankId"] } } },
            { $replaceRoot: { newRoot: "$bank" } },
          ],
        },
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
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
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
          bank: { $first: "$bank" },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionBy",
          foreignField: "_id",
          as: "actionByEmp",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "actionBy",
          foreignField: "_id",
          as: "actionByUser",
        },
      },
      {
        $addFields: {
          actionBy: { $ifNull: [{ $first: "$actionByEmp" }, { $first: "$actionByUser" }] },
        },
      },
      {
        $addFields: {
          actionBy: {
            $cond: {
              if: { $eq: [{ $type: "$actionBy.username" }, "string"] },
              then: {
                name: "$actionBy.username",
                employeeId: "ADMIN-USER",
              },
              else: "$actionBy",
            },
          },
        },
      },
      // Resolve all performers from both actionLog and timeline
      {
        $lookup: {
          from: "employees",
          let: { 
            logIds: { $ifNull: ["$actionLog.performedBy", []] },
            tlIds: { $ifNull: ["$timeline.performedBy", []] }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$_id", "$$logIds"] },
                    { $in: ["$_id", "$$tlIds"] }
                  ]
                }
              }
            }
          ],
          as: "_logEmployees",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { 
            logIds: { $ifNull: ["$actionLog.performedBy", []] },
            tlIds: { $ifNull: ["$timeline.performedBy", []] }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$_id", "$$logIds"] },
                    { $in: ["$_id", "$$tlIds"] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: "employees",
                localField: "employee",
                foreignField: "_id",
                as: "employeeData"
              }
            },
            {
              $addFields: {
                employeeData: { $first: "$employeeData" }
              }
            }
          ],
          as: "_logUsers",
        },
      },
      {
        $addFields: {
          actionLog: {
            $map: {
              input: { $ifNull: ["$actionLog", []] },
              as: "log",
              in: {
                action: "$$log.action",
                performedBy: "$$log.performedBy",
                performedAt: "$$log.performedAt",
                comments: "$$log.comments",
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
                            else: { 
                                name: { $ifNull: ["$$emp.name", "System"] }, 
                                employeeId: { $ifNull: ["$$emp.employeeId", "N/A"] } 
                            }
                          }
                        }
                      },
                    },
                  },
                },
              },
            },
          },
          timeline: {
            $map: {
              input: { $ifNull: ["$timeline", []] },
              as: "tl",
              in: {
                event: "$$tl.event",
                performedBy: "$$tl.performedBy",
                performedAt: "$$tl.performedAt",
                details: "$$tl.details",
                timeTaken: "$$tl.timeTaken",
                performerName: {
                  $let: {
                    vars: {
                      emp: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logEmployees", as: "e", cond: { $eq: ["$$e._id", "$$tl.performedBy"] } } },
                          0,
                        ],
                      },
                      usr: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logUsers", as: "u", cond: { $eq: ["$$u._id", "$$tl.performedBy"] } } },
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
                            else: { 
                                name: { $ifNull: ["$$emp.name", "System"] }, 
                                employeeId: { $ifNull: ["$$emp.employeeId", "N/A"] } 
                            }
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
        $project: {
          _logEmployees: 0,
          _logUsers: 0,
          actionByEmp: 0,
          actionByUser: 0,
        },
      },
      {
        $match: filter,
      },
      { $sort: { createdAt: -1 } },
    ]).exec();
    return results;
  } catch (err) {
    throw err;
  }
}

async function findById(id) {
  try {
    const sales = await Sales.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "customers",
          localField: "customer",
          foreignField: "_id",
          as: "bank",
          let: { bankId: "$bank" },
          pipeline: [
            { $unwind: "$bank" },
            { $match: { $expr: { $eq: ["$bank._id", "$$bankId"] } } },
            { $replaceRoot: { newRoot: "$bank" } },
          ],
        },
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
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
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
          bank: { $first: "$bank" },
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "actionBy",
          foreignField: "_id",
          as: "actionByEmp",
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "actionBy",
          foreignField: "_id",
          as: "actionByUser",
        },
      },
      {
        $addFields: {
          actionBy: {
            $ifNull: [{ $first: "$actionByEmp" }, { $first: "$actionByUser" }],
          },
        },
      },
      {
        $addFields: {
          actionBy: {
            $cond: {
              if: { $eq: [{ $type: "$actionBy.username" }, "string"] },
              then: {
                name: "$actionBy.username",
                employeeId: "ADMIN-USER",
              },
              else: "$actionBy",
            },
          },
        },
      },
      // Resolve all performers from both actionLog and timeline
      {
        $lookup: {
          from: "employees",
          let: { 
            logIds: { $ifNull: ["$actionLog.performedBy", []] },
            tlIds: { $ifNull: ["$timeline.performedBy", []] }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$_id", "$$logIds"] },
                    { $in: ["$_id", "$$tlIds"] }
                  ]
                }
              }
            }
          ],
          as: "_logEmployees",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { 
            logIds: { $ifNull: ["$actionLog.performedBy", []] },
            tlIds: { $ifNull: ["$timeline.performedBy", []] }
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $in: ["$_id", "$$logIds"] },
                    { $in: ["$_id", "$$tlIds"] }
                  ]
                }
              }
            },
            {
              $lookup: {
                from: "employees",
                localField: "employee",
                foreignField: "_id",
                as: "employeeData"
              }
            },
            {
              $addFields: {
                employeeData: { $first: "$employeeData" }
              }
            }
          ],
          as: "_logUsers",
        },
      },
      {
        $addFields: {
          actionLog: {
            $map: {
              input: { $ifNull: ["$actionLog", []] },
              as: "log",
              in: {
                action: "$$log.action",
                performedBy: "$$log.performedBy",
                performedAt: "$$log.performedAt",
                comments: "$$log.comments",
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
                            else: { 
                                name: { $ifNull: ["$$emp.name", "System"] }, 
                                employeeId: { $ifNull: ["$$emp.employeeId", "N/A"] } 
                            }
                          }
                        }
                      },
                    },
                  },
                },
              },
            },
          },
          timeline: {
            $map: {
              input: { $ifNull: ["$timeline", []] },
              as: "tl",
              in: {
                event: "$$tl.event",
                performedBy: "$$tl.performedBy",
                performedAt: "$$tl.performedAt",
                details: "$$tl.details",
                timeTaken: "$$tl.timeTaken",
                performerName: {
                  $let: {
                    vars: {
                      emp: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logEmployees", as: "e", cond: { $eq: ["$$e._id", "$$tl.performedBy"] } } },
                          0,
                        ],
                      },
                      usr: {
                        $arrayElemAt: [
                          { $filter: { input: "$_logUsers", as: "u", cond: { $eq: ["$$u._id", "$$tl.performedBy"] } } },
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
                            else: { 
                                name: { $ifNull: ["$$emp.name", "System"] }, 
                                employeeId: { $ifNull: ["$$emp.employeeId", "N/A"] } 
                            }
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
        $project: {
          _logEmployees: 0,
          _logUsers: 0,
          actionByEmp: 0,
          actionByUser: 0,
        },
      },
      { $limit: 1 },
    ]).exec();
    return sales[0];
  } catch (err) {
    throw err;
  }
}

async function count(query = {}) {
  try {
    if (query.createdAt) {
      query.createdAt = new Date(query.createdAt).toISOString();
      query.createdAt = {
        $gte: new Date(query.createdAt.replace(/T.*Z/, "T00:00:00Z")),
        $lte: new Date(query.createdAt.replace(/T.*Z/, "T23:59:59Z")),
      };
    }
    return await Sales.count(query);
  } catch (err) {
    throw err;
  }
}

async function aggregate(query = {}) {
  try {
    return await Sales.aggregate(query).exec();
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    const Customer = require("../models/customer");
    const QREnquiry = require("../models/qrEnquiry");
    const Release = require("../models/release");

    payload.billId = Math.floor(100000 + Math.random() * 900000);
    
    // Build Initial Timeline
    const timeline = [];
    const customer = await Customer.findById(payload.customer).exec();
    
    if (customer) {
      // 1. Enquiry Stage
      if (customer.enqID) {
        const enquiry = await QREnquiry.findOne({ enqID: customer.enqID }).exec();
        if (enquiry) {
          timeline.push({
            event: "Enquiry Raised",
            performedAt: enquiry.createdAt,
            details: `Enquiry ID: ${enquiry.enqID}`,
          });
        }
      }

    // 2. Registration Stage
      timeline.push({
        event: "Customer registered",
        performedBy: customer.createdBy || payload.employee,
        performedAt: customer.createdAt,
        details: `Customer ID generated: ${customer.customerId}`,
      });

      // 3. Address Added
      if (customer.address && customer.address.length > 0) {
        const latestAddress = customer.address[customer.address.length - 1];
        timeline.push({
          event: "Address added",
          performedBy: latestAddress.createdBy || customer.createdBy || payload.employee,
          performedAt: latestAddress.createdAt || customer.createdAt,
          details: `New address added: ${latestAddress.area || latestAddress.address}`,
        });
      }

      // 4. Bank Added
      if (customer.bank && customer.bank.length > 0) {
        const latestBank = customer.bank[customer.bank.length - 1];
        timeline.push({
          event: "Bank added",
          performedBy: latestBank.createdBy || customer.createdBy || payload.employee,
          performedAt: latestBank.createdAt || customer.createdAt,
          details: `New bank added: ${latestBank.bankName} (${latestBank.accountNumber})`,
        });
      }
    }

    // 5. Release Added (if any)
    if (payload.release && payload.release.length > 0) {
      const releases = await Release.find({ _id: { $in: payload.release } }).lean().exec();
      for (const rel of releases) {
        timeline.push({
          event: "Release Added",
          performedBy: rel.actionBy || payload.employee,
          performedAt: rel.createdAt,
          details: `Release Amount: ${rel.payableAmount}`,
        });
      }
      payload.release = releases;
    }

    // 6. Billing Initiated (Current Action)
    timeline.push({
      event: "Billing Initiated",
      performedBy: payload.employee,
      performedAt: new Date(),
    });

    // Calculate timeTaken (TTL) for each stage
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      curr.timeTaken = Math.floor((new Date(curr.performedAt) - new Date(prev.performedAt)) / 1000);
    }

    payload.timeline = timeline;
    payload.actionLog = [
      {
        action: payload.status || "finance pending",
        performedBy: payload.employee,
        performedAt: new Date(),
      },
    ];
    
    let sale = new Sales(payload);
    return await sale.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    const sale = await Sales.findById(id).exec();
    if (!sale) throw new Error("Sale not found");

    // Sequence validation:
    if (payload.status === "finance pending" && !sale.bullionCompleted && !payload.bullionCompleted) {
      throw new Error("Cannot update sale status: Bullion Desk must approve first");
    }
    if (payload.status === "completed" && !sale.financeCompleted && !payload.financeCompleted) {
      throw new Error("Cannot update sale status: Finance must approve first");
    }

    if (payload.release && payload.release.length > 0) {
      const releaseIds = payload.release.map(r => r._id || r);
      const ReleaseModel = require("../models/release");
      const releases = await ReleaseModel.find({ _id: { $in: releaseIds } }).lean().exec();
      payload.release = releases;
    }

    const updatedSale = await Sales.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();

    // Bidirectional synchronization to Release
    if (updatedSale && updatedSale.release && updatedSale.release.length > 0) {
      const Release = require("../models/release");
      const releaseSync = {};
      if (payload.financeCompleted !== undefined) releaseSync.financeCompleted = payload.financeCompleted;
      if (payload.assigneeCompleted !== undefined) releaseSync.assigneeCompleted = payload.assigneeCompleted;
      
      if (Object.keys(releaseSync).length > 0) {
        const releaseIds = updatedSale.release.map(r => r._id || r);
        await Release.updateMany(
          { _id: { $in: releaseIds } },
          { $set: releaseSync }
        ).exec();
      }
    }

    return updatedSale;
  } catch (err) {
    throw err;
  }
}

async function updateWithLog(id, setData, logEntry) {
  try {
    const sale = await Sales.findById(id).exec();
    if (!sale) throw new Error("Sale not found");

    // Sequence validation:
    if (setData.status === "finance pending" && !sale.bullionCompleted && !setData.bullionCompleted) {
      throw new Error("Cannot update sale status: Bullion Desk must approve first");
    }
    if (setData.status === "completed" && !sale.financeCompleted && !setData.financeCompleted) {
      throw new Error("Cannot update sale status: Finance must approve first");
    }

    const timelineEntry = {
      event: logEntry.action,
      performedBy: logEntry.performedBy,
      performedAt: logEntry.performedAt,
      details: logEntry.comments,
    };

    // Calculate TTL for this stage
    const lastTimeline = sale.timeline[sale.timeline.length - 1];
    if (lastTimeline) {
      timelineEntry.timeTaken = Math.floor((new Date(logEntry.performedAt) - new Date(lastTimeline.performedAt)) / 1000);
    }

    const updatedSale = await Sales.findByIdAndUpdate(
      id,
      {
        $set: setData,
        $push: { 
          actionLog: logEntry,
          timeline: timelineEntry
        },
      },
      { returnDocument: "after" }
    ).exec();

    // Synchronize linked releases if status or completion flags are updated
    if (updatedSale.release && updatedSale.release.length > 0) {
      const Release = require("../models/release");
      const releaseSync = {};
      if (setData.status && sale.status !== setData.status && setData.status === 'release pending') {
        releaseSync.status = setData.status;
      }
      if (setData.financeCompleted !== undefined) {
        releaseSync.financeCompleted = setData.financeCompleted;
      }
      if (setData.assigneeCompleted !== undefined) {
        releaseSync.assigneeCompleted = setData.assigneeCompleted;
      }

      if (Object.keys(releaseSync).length > 0) {
        const updatePayload = { $set: releaseSync };
        if (setData.status && sale.status !== setData.status && setData.status === 'release pending') {
          updatePayload.$push = {
            actionLog: {
              action: setData.status,
              performedBy: logEntry.performedBy,
              performedAt: logEntry.performedAt
            }
          };
        }
        const releaseIds = updatedSale.release.map(r => r._id || r);
        await Release.updateMany(
          { _id: { $in: releaseIds } },
          updatePayload
        ).exec();
      }
    }

    return updatedSale;
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    const ids = id.split(",");
    const salesToDelete = await Sales.find({ _id: { $in: ids } }).exec();
    
    // Cascading delete: Remove all linked releases first
    for (const sale of salesToDelete) {
      if (sale.release && sale.release.length > 0) {
        await Release.deleteMany({ _id: { $in: sale.release } }).exec();
      }
    }

    return await Sales.deleteMany({
      _id: {
        $in: ids,
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function branchConsolidatedSaleReport(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    return await Sales.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
        },
      },
      {
        $addFields: {
          rate: {
            $cond: {
              if: { $eq: ["$purchaseType", "gold"] },
              then: "$goldRate",
              else: "$silverRate",
            },
          },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            purchaseType: "$purchaseType",
            saleType: "$saleType",
          },
          grossWeight: { $sum: "$grossWeight" },
          netWeight: { $sum: "$netWeight" },
          netAmount: { $sum: "$netAmount" },
          payableAmount: { $sum: "$payableAmount" },
          bills: { $count: {} },
          ornaments: { $sum: { $size: "$ornaments" } },
          rate: { $first: "$rate" },
          releaseAmount: {
            $sum: {
              $reduce: {
                input: "$release",
                initialValue: 0,
                in: { $sum: ["$$value", "$$this.payableAmount"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          type: "$_id.purchaseType",
          saleType: "$_id.saleType",
          grossWeight: 1,
          grossWeight: 1,
          netWeight: 1,
          netAmount: 1,
          payableAmount: 1,
          releaseAmount: 1,
          bills: 1,
          ornaments: 1,
          rate: 1,
        },
      },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function adminConsolidatedSaleReport(query = {}) {
  try {
    if (query.createdAt && "$gte" in query.createdAt) {
      query.createdAt["$gte"] = new Date(
        new Date(query.createdAt["$gte"])
          .toISOString()
          .replace(/T.*Z/, "T00:00:00Z")
      );
    }
    if (query.createdAt && "$lte" in query.createdAt) {
      query.createdAt["$lte"] = new Date(
        new Date(query.createdAt["$lte"])
          .toISOString()
          .replace(/T.*Z/, "T23:59:59Z")
      );
    }
    if (query.branch) {
      query.branch = new mongoose.Types.ObjectId(query.branch);
    } else {
      delete query.branch;
    }
    return await Sales.aggregate([
      { $match: query },
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
          from: "releases",
          localField: "release",
          foreignField: "_id",
          as: "release",
        },
      },
      {
        $addFields: {
          rate: {
            $cond: {
              if: { $eq: ["$purchaseType", "gold"] },
              then: "$goldRate",
              else: "$silverRate",
            },
          },
          branch: { $first: "$branch" },
        },
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            purchaseType: "$purchaseType",
            branch: "$branch.branchId",
            saleType: "$saleType",
          },
          grossWeight: { $sum: "$grossWeight" },
          netWeight: { $sum: "$netWeight" },
          netAmount: { $sum: "$netAmount" },
          payableAmount: { $sum: "$payableAmount" },
          bills: { $count: {} },
          ornaments: { $sum: { $size: "$ornaments" } },
          rate: { $first: "$rate" },
          branch: { $first: "$branch.branchName" },
          releaseAmount: {
            $sum: {
              $reduce: {
                input: "$release",
                initialValue: 0,
                in: { $sum: ["$$value", "$$this.payableAmount"] },
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          date: "$_id.date",
          type: "$_id.purchaseType",
          saleType: "$_id.saleType",
          grossWeight: 1,
          netWeight: 1,
          netAmount: 1,
          payableAmount: 1,
          releaseAmount: 1,
          bills: 1,
          ornaments: 1,
          rate: 1,
          branch: 1,
        },
      },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  count,
  aggregate,
  create,
  update,
  updateWithLog,
  remove,
  branchConsolidatedSaleReport,
  adminConsolidatedSaleReport,
};
