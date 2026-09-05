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
      query.createdAt = dateFilter;
    }
    if (query.branch) {
      if (mongoose.Types.ObjectId.isValid(String(query.branch))) { query.branch = new mongoose.Types.ObjectId(String(query.branch)); } else { delete query.branch; }
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
    if (query.customer && mongoose.Types.ObjectId.isValid(String(query.customer))) {
      query.customer = new mongoose.Types.ObjectId(String(query.customer));
    } else {
      delete query.customer;
    }
    if (query._id) {
      if (query._id.$in) {
        query._id.$in = query._id.$in.map(id => new mongoose.Types.ObjectId(id));
      } else if (typeof query._id === "string") {
        query._id = new mongoose.Types.ObjectId(query._id);
      }
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
            {
              $lookup: {
                from: "fileuploads",
                let: { bid: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toString: "$uploadId" }, { $toString: "$$bid" }] },
                          { $eq: ["$uploadName", "customer_bank"] }
                        ]
                      }
                    }
                  }
                ],
                as: "proofFiles",
              },
            },
            {
              $addFields: {
                proof: { $first: "$proofFiles" }
              }
            },
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
                let: { customerId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toString: "$uploadId" }, { $toString: "$$customerId" }] },
                          { $eq: ["$uploadType", "profile_image"] }
                        ]
                      }
                    }
                  },
                  { $sort: { createdAt: -1 } }
                ],
                as: "profileImage",
              },
            },
            {
              $lookup: {
                from: "fileuploads",
                let: { customerId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toString: "$uploadId" }, { $toString: "$$customerId" }] },
                          { $eq: ["$uploadType", "signature"] }
                        ]
                      }
                    }
                  },
                  { $sort: { createdAt: -1 } }
                ],
                as: "signatureImage",
              },
            },
            {
              $lookup: {
                from: "fileuploads",
                let: { customerId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [{ $toString: "$uploadId" }, { $toString: "$$customerId" }]
                      }
                    }
                  }
                ],
                as: "kycProofs",
              },
            },
            {
              $addFields: {
                profileImage: { $first: "$profileImage" },
                signatureImage: { $first: "$signatureImage" },
              },
            },
          ],
          as: "customer",
        },
      },

      {
        $lookup: {
          from: "fileuploads",
          let: { 
            saleId: "$_id", 
            releaseIds: { $map: { input: { $ifNull: ["$release", []] }, as: "r", in: "$$r._id" } } 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$uploadId", { $concatArrays: [["$$saleId"], "$$releaseIds"] }]
                }
              }
            }
          ],
          as: "proof",
        },
      },
      {
        $lookup: {
          from: "transits",
          localField: "_id",
          foreignField: "saleIds",
          as: "transits"
        }
      },
      {
        $lookup: {
          from: "fileuploads",
          let: { 
            transitProofIds: { 
              $filter: {
                input: {
                  $concatArrays: [
                    { $map: { input: "$transits", as: "t", in: "$$t.proof" } },
                    { $map: { input: "$transits", as: "t", in: "$$t.receivedProof" } }
                  ]
                },
                as: "pid",
                cond: { $ne: ["$$pid", null] }
              }
            } 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$transitProofIds"]
                }
              }
            }
          ],
          as: "transitProofs",
        }
      },
      {
        $addFields: {
          proof: { $concatArrays: ["$proof", "$transitProofs"] }
        }
      },
      {
         $project: {
            transits: 0,
            transitProofs: 0
         }
      },
      {
        $lookup: {
          from: "meltings",
          localField: "_id",
          foreignField: "saleIds",
          as: "meltings"
        }
      },
      {
        $lookup: {
          from: "fileuploads",
          let: { 
            meltingProofIds: { 
              $filter: {
                input: {
                  $concatArrays: [
                    { $map: { input: "$meltings", as: "m", in: "$$m.meltProof" } },
                    { $map: { input: "$meltings", as: "m", in: "$$m.afterMeltProof" } }
                  ]
                },
                as: "pid",
                cond: { $ne: ["$$pid", null] }
              }
            } 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$meltingProofIds"]
                }
              }
            }
          ],
          as: "meltingProofs",
        }
      },
      {
        $addFields: {
          proof: { $concatArrays: ["$proof", "$meltingProofs"] }
        }
      },
      {
         $project: {
            meltings: 0,
            meltingProofs: 0
         }
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
                proof: "$$tl.proof",
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
            {
              $lookup: {
                from: "fileuploads",
                let: { bid: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toString: "$uploadId" }, { $toString: "$$bid" }] },
                          { $eq: ["$uploadName", "customer_bank"] }
                        ]
                      }
                    }
                  }
                ],
                as: "proofFiles",
              },
            },
            {
              $addFields: {
                proof: { $first: "$proofFiles" }
              }
            },
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
                let: { customerId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toString: "$uploadId" }, { $toString: "$$customerId" }] },
                          { $eq: ["$uploadType", "profile_image"] }
                        ]
                      }
                    }
                  },
                  { $sort: { createdAt: -1 } }
                ],
                as: "profileImage",
              },
            },
            {
              $lookup: {
                from: "fileuploads",
                let: { customerId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: [{ $toString: "$uploadId" }, { $toString: "$$customerId" }] },
                          { $eq: ["$uploadType", "signature"] }
                        ]
                      }
                    }
                  },
                  { $sort: { createdAt: -1 } }
                ],
                as: "signatureImage",
              },
            },
            {
              $lookup: {
                from: "fileuploads",
                let: { customerId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $eq: [{ $toString: "$uploadId" }, { $toString: "$$customerId" }]
                      }
                    }
                  }
                ],
                as: "kycProofs",
              },
            },
            {
              $lookup: {
                from: "fileuploads",
                let: { addressIds: "$address._id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $in: ["$uploadId", { $ifNull: ["$$addressIds", []] }] },
                          { $eq: ["$uploadName", "customer_address"] }
                        ]
                      }
                    }
                  }
                ],
                as: "addressProofs",
              },
            },
            {
              $addFields: {
                profileImage: { $first: "$profileImage" },
                signatureImage: { $first: "$signatureImage" },
              },
            },
          ],
          as: "customer",
        },
      },

      {
        $lookup: {
          from: "fileuploads",
          let: { 
            saleId: "$_id", 
            releaseIds: { $map: { input: { $ifNull: ["$release", []] }, as: "r", in: "$$r._id" } } 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$uploadId", { $concatArrays: [["$$saleId"], "$$releaseIds"] }]
                }
              }
            }
          ],
          as: "proof",
        },
      },
      {
        $lookup: {
          from: "transits",
          localField: "_id",
          foreignField: "saleIds",
          as: "transits"
        }
      },
      {
        $lookup: {
          from: "fileuploads",
          let: { 
            transitProofIds: { 
              $filter: {
                input: {
                  $concatArrays: [
                    { $map: { input: "$transits", as: "t", in: "$$t.proof" } },
                    { $map: { input: "$transits", as: "t", in: "$$t.receivedProof" } }
                  ]
                },
                as: "pid",
                cond: { $ne: ["$$pid", null] }
              }
            } 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$transitProofIds"]
                }
              }
            }
          ],
          as: "transitProofs",
        }
      },
      {
        $addFields: {
          proof: { $concatArrays: ["$proof", "$transitProofs"] }
        }
      },
      {
         $project: {
            transits: 0,
            transitProofs: 0
         }
      },
      {
        $lookup: {
          from: "meltings",
          localField: "_id",
          foreignField: "saleIds",
          as: "meltings"
        }
      },
      {
        $lookup: {
          from: "fileuploads",
          let: { 
            meltingProofIds: { 
              $filter: {
                input: {
                  $concatArrays: [
                    { $map: { input: "$meltings", as: "m", in: "$$m.meltProof" } },
                    { $map: { input: "$meltings", as: "m", in: "$$m.afterMeltProof" } }
                  ]
                },
                as: "pid",
                cond: { $ne: ["$$pid", null] }
              }
            } 
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ["$_id", "$$meltingProofIds"]
                }
              }
            }
          ],
          as: "meltingProofs",
        }
      },
      {
        $addFields: {
          proof: { $concatArrays: ["$proof", "$meltingProofs"] }
        }
      },
      {
         $project: {
            meltings: 0,
            meltingProofs: 0
         }
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
                proof: "$$tl.proof",
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
          //details: `New bank added: ${latestBank.bankName} (${latestBank.accountNumber})`,
          details: `New bank added: ${latestBank.bankName} (${latestBank.accountNo})`,
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

    // 7. Initial State (e.g. Bullion Pending)
    timeline.push({
      event: payload.status || "bullion pending",
      performedBy: payload.employee,
      performedAt: new Date(),
    });

    // Calculate timeTaken (TTL) for each stage
    for (let i = 1; i < timeline.length; i++) {
      const prev = timeline[i - 1];
      const curr = timeline[i];
      let diff = Math.floor((new Date(curr.performedAt) - new Date(prev.performedAt)) / 1000);
      
      if (diff === 0 && curr.event && curr.event.toLowerCase() === 'bullion pending' && prev.event && prev.event.toLowerCase() === 'billing initiated') {
        curr.timeTaken = prev.timeTaken || 0;
      } else {
        curr.timeTaken = diff;
      }
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
    const savedSale = await sale.save();

    if (savedSale && ['physical', 'pledged'].includes(savedSale.saleType) && savedSale.status === 'completed' && !savedSale.invoiceSent) {
      setImmediate(() => {
        triggerCompletedInvoiceWhatsApp(savedSale._id);
      });
    }

    return savedSale;
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

    if (updatedSale && ['physical', 'pledged'].includes(updatedSale.saleType) && updatedSale.status === 'completed' && !updatedSale.invoiceSent) {
      setImmediate(() => {
        triggerCompletedInvoiceWhatsApp(updatedSale._id);
      });
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
      proof: setData.financeProof || setData.assigneeProof || setData.fundTransferProof || null,
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

    if (updatedSale && ['physical', 'pledged'].includes(updatedSale.saleType) && updatedSale.status === 'completed' && !updatedSale.invoiceSent) {
      setImmediate(() => {
        triggerCompletedInvoiceWhatsApp(updatedSale._id);
      });
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
      if (mongoose.Types.ObjectId.isValid(String(query.branch))) { query.branch = new mongoose.Types.ObjectId(String(query.branch)); } else { delete query.branch; }
    } else {
      delete query.branch;
    }
    return await Sales.aggregate([
      { $match: query },

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
      if (mongoose.Types.ObjectId.isValid(String(query.branch))) { query.branch = new mongoose.Types.ObjectId(String(query.branch)); } else { delete query.branch; }
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

async function triggerCompletedInvoiceWhatsApp(saleId) {
  try {
    const sale = await Sales.findById(saleId)
      .populate('customer branch')
      .exec();

    if (!sale) {
      console.warn(`[WhatsApp Invoice] Sale not found: ${saleId}`);
      return;
    }
    if (!['physical', 'pledged'].includes(sale.saleType)) {
      console.log(`[WhatsApp Invoice] Skipped sale ${sale.billId || saleId}: saleType '${sale.saleType}' not eligible`);
      return;
    }
    if (sale.status !== 'completed') {
      console.log(`[WhatsApp Invoice] Skipped sale ${sale.billId || saleId}: status is '${sale.status}' (invoice triggers only when 'completed')`);
      return;
    }
    if (sale.invoiceSent) {
      console.log(`[WhatsApp Invoice] Skipped sale ${sale.billId || saleId}: invoice already sent`);
      return;
    }

    const { generateAndUploadInvoice, generateAndUploadReleaseInvoice } = require('./invoicePdf');
    const { sendWhatsAppInvoice, sendWhatsAppReleaseInvoice } = require('./whatsapp');

    const customerPhone = sale.customer?.whatsappNumber || sale.customer?.phoneNumber;

    if (sale.saleType === 'physical') {
      // 1. Generate & upload physical invoice PDF
      const { pdfUrl, filename } = await generateAndUploadInvoice(sale);

      // 2. Calculate values for WhatsApp body template
      const grossWeight = (sale.ornaments || []).reduce((sum, orn) => sum + Number(orn.grossWeight || 0), 0);
      const netWeight = Number(sale.netWeight || 0);
      const totalAmount = Math.round(Number(sale.payableAmount || sale.netAmount || 0));

      // 3. Send WhatsApp Invoice to customer's WhatsApp/mobile number
      if (customerPhone) {
        const invoiceData = {
          customerName: sale.customer?.name || "Customer",
          branchName: sale.branch?.branchName || "MK Gold",
          goldRate: sale.goldRate || "0",
          billId: sale.billId || "",
          grossWeight: grossWeight.toFixed(2),
          netWeight: netWeight.toFixed(2),
          totalAmount: totalAmount.toString()
        };

        await sendWhatsAppInvoice(customerPhone, pdfUrl, filename, invoiceData);
      }

      // 4. Update sale record with invoice URL and flag
      await Sales.findByIdAndUpdate(saleId, {
        $set: {
          invoicePdfUrl: pdfUrl,
          invoiceSent: true
        }
      });

      console.log(`Invoice PDF generated and sent via WhatsApp for physical bill ${sale.billId}`);
    } else if (sale.saleType === 'pledged') {
      // 1. Generate & upload release receipt PDF
      const { pdfUrl, filename } = await generateAndUploadReleaseInvoice(sale);

      // 2. Calculate release values for WhatsApp template
      const releases = sale.release || [];
      const bankName = releases.map(r => r.pledgedIn).filter(Boolean).join(', ') || 'Bank';
      const loanNo = releases.map(r => r.pledgeId).filter(Boolean).join(', ') || 'N/A';

      const dateObj = sale.createdAt ? new Date(sale.createdAt) : new Date();
      const dd = String(dateObj.getDate()).padStart(2, '0');
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const yyyy = dateObj.getFullYear();
      const date = `${dd}-${mm}-${yyyy}`;

      const branchName = sale.branch?.branchName || 'MK Gold';
      const goldRate = String(sale.goldRate || 0);
      const billId = String(sale.billId || '');

      let grossWeightNum = (sale.ornaments || []).reduce((sum, orn) => sum + Number(orn.grossWeight || 0), 0);
      if (grossWeightNum === 0 && releases.length > 0) {
        grossWeightNum = releases.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
      }
      const grossWeight = grossWeightNum.toFixed(2);
      const netWeight = Number(sale.netWeight || 0).toFixed(2);

      const totalPledgeAmt = releases.reduce((sum, r) => sum + (Number(r.pledgeAmount) || 0), 0);
      const totalReleasePayable = releases.reduce((sum, r) => sum + (Number(r.payableAmount) || 0), 0);
      const releaseAmount = Math.round(totalPledgeAmt > 0 ? totalPledgeAmt : totalReleasePayable).toString();
      const payableAmount = Math.round(Number(sale.payableAmount || 0)).toString();

      // 3. Send WhatsApp Release Invoice
      if (customerPhone) {
        const releaseData = {
          customerName: sale.customer?.name || "Customer",
          bankName,
          loanNo,
          date,
          branchName,
          goldRate,
          billId,
          grossWeight,
          netWeight,
          releaseAmount,
          payableAmount
        };

        await sendWhatsAppReleaseInvoice(customerPhone, pdfUrl, filename, releaseData);
      }

      // 4. Update sale record with invoice URL and flag
      await Sales.findByIdAndUpdate(saleId, {
        $set: {
          invoicePdfUrl: pdfUrl,
          invoiceSent: true
        }
      });

      console.log(`Release Receipt PDF generated and sent via WhatsApp for release bill ${sale.billId}`);
    }
  } catch (err) {
    console.error(`[WhatsApp Invoice] Failed to trigger invoice WhatsApp for sale ${saleId}:`, err);
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
  triggerCompletedInvoiceWhatsApp,
};
