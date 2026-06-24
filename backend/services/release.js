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
    if (query.branch && mongoose.Types.ObjectId.isValid(String(query.branch))) {
      query.branch = new mongoose.Types.ObjectId(String(query.branch));
    } else {
      delete query.branch;
    }
    if (query.phoneNumber) {
      filter["customer.phoneNumber"] = query.phoneNumber;
      delete query.phoneNumber;
    } else {
      delete query.phoneNumber;
    }
    if (query.customer && mongoose.Types.ObjectId.isValid(String(query.customer))) {
      query.customer = new mongoose.Types.ObjectId(String(query.customer));
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

    if (updatedRelease) {
      const queryId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      const linkedSales = await Sales.find({
        "release._id": { $in: [queryId, id.toString()] }
      }).exec();
      for (const sale of linkedSales) {
        const updatedReleaseArray = sale.release.map(rel => {
          if (rel._id && rel._id.toString() === id.toString()) {
            return updatedRelease.toObject();
          }
          return rel;
        });

        const setDataSales = {
          release: updatedReleaseArray
        };

        if (payload.status === "completed" || updatedRelease.status === "completed") {
          setDataSales.status = "bullion pending";
          setDataSales.assigneeCompleted = true;
          setDataSales.bullionCompleted = false;
          setDataSales.financeCompleted = false;

          let allOrnaments = [];
          for (const rel of updatedReleaseArray) {
            if (rel.status === "completed" && rel.ornaments) {
              allOrnaments = allOrnaments.concat(rel.ornaments);
            }
          }
          setDataSales.ornaments = allOrnaments;

          const netWeight = allOrnaments.reduce((sum, orn) => sum + (Number(orn.netWeight) || 0), 0);
          const netAmount = Math.round(allOrnaments.reduce((sum, orn) => sum + (Number(orn.netAmount) || 0), 0));
          const totalReleasePayable = updatedReleaseArray.reduce((sum, rel) => sum + (Number(rel.payableAmount) || 0), 0);
          const marginPercent = Number(sale.margin) || 0;
          const payableAmount = Math.round(netAmount - (netAmount * marginPercent) / 100) - totalReleasePayable;

          setDataSales.netWeight = netWeight;
          setDataSales.netAmount = netAmount;
          setDataSales.payableAmount = payableAmount;
        }

        if (payload.financeCompleted !== undefined) {
          setDataSales.financeCompleted = payload.financeCompleted;
        }
        if (payload.assigneeCompleted !== undefined) {
          setDataSales.assigneeCompleted = payload.assigneeCompleted;
        }

        await Sales.findByIdAndUpdate(sale._id, setDataSales).exec();
      }
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

    if (updatedRelease) {
      const queryId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;
      const linkedSales = await Sales.find({
        "release._id": { $in: [queryId, id.toString()] }
      }).exec();
      const salesService = require("./sales");
      for (const sale of linkedSales) {
        const updatedReleaseArray = sale.release.map(rel => {
          if (rel._id && rel._id.toString() === id.toString()) {
            return updatedRelease.toObject();
          }
          return rel;
        });

        const setDataSales = {
          release: updatedReleaseArray
        };

        if (setData.status === "completed" || updatedRelease.status === "completed") {
          setDataSales.status = "bullion pending";
          setDataSales.assigneeCompleted = true;
          setDataSales.bullionCompleted = false;
          setDataSales.financeCompleted = false;

          let allOrnaments = [];
          for (const rel of updatedReleaseArray) {
            if (rel.status === "completed" && rel.ornaments) {
              allOrnaments = allOrnaments.concat(rel.ornaments);
            }
          }
          setDataSales.ornaments = allOrnaments;

          const netWeight = allOrnaments.reduce((sum, orn) => sum + (Number(orn.netWeight) || 0), 0);
          const netAmount = Math.round(allOrnaments.reduce((sum, orn) => sum + (Number(orn.netAmount) || 0), 0));
          const totalReleasePayable = updatedReleaseArray.reduce((sum, rel) => sum + (Number(rel.payableAmount) || 0), 0);
          const marginPercent = Number(sale.margin) || 0;
          const payableAmount = Math.round(netAmount - (netAmount * marginPercent) / 100) - totalReleasePayable;

          setDataSales.netWeight = netWeight;
          setDataSales.netAmount = netAmount;
          setDataSales.payableAmount = payableAmount;
        }

        if (setData.financeCompleted !== undefined) {
          setDataSales.financeCompleted = setData.financeCompleted;
        }
        if (setData.assigneeCompleted !== undefined) {
          setDataSales.assigneeCompleted = setData.assigneeCompleted;
        }

        await salesService.updateWithLog(sale._id, setDataSales, logEntry);
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
    const objectIds = ids.map(idStr => new mongoose.Types.ObjectId(idStr));
    const stringIds = ids.map(idStr => idStr.toString());
    const queryIds = [...objectIds, ...stringIds];
    
    // Remove references/embedded documents from Sales model
    await Sales.updateMany(
      { "release._id": { $in: queryIds } },
      { $pull: { release: { _id: { $in: queryIds } } } }
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
