const Attendance = require("../models/attendance");
const Employee = require("../models/employee");
const Payprocess = require("../models/payprocess");
const Leave = require("../models/leave");
const User = require("../models/user");
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
      
      // If it's a sub-role, only show their own attendance
      if (userType !== "branch") {
        query.employee = user.employee?._id || user.employee;
      }
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
    return await Attendance.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "attendance",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $addFields: {
          attendance: { $first: "$attendance" },
          employee: { $first: "$employee" },
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
    return await Attendance.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "fileuploads",
          localField: "_id",
          foreignField: "uploadId",
          as: "attendance",
        },
      },
      {
        $lookup: {
          from: "employees",
          localField: "employee",
          foreignField: "_id",
          as: "employee",
        },
      },
      {
        $addFields: {
          attendance: { $first: "$attendance" },
          employee: { $first: "$employee" },
        },
      },
      { $limit: 1 },
    ]).exec();
  } catch (err) {
    throw err;
  }
}

async function aggregate(query = {}) {
  try {
    return await Attendance.aggregate(query).exec();
  } catch (err) {
    throw err;
  }
}

async function count(query = {}) {
  try {
    return await Attendance.count(query);
  } catch (err) {
    throw err;
  }
}

async function create(payload) {
  try {
    let goldRate = new Attendance(payload);
    return await goldRate.save();
  } catch (err) {
    throw err;
  }
}

async function update(id, payload) {
  try {
    return await Attendance.findByIdAndUpdate(id, payload, {
      returnDocument: "after",
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function remove(id) {
  try {
    return await Attendance.deleteMany({
      _id: {
        $in: id.split(","),
      },
    }).exec();
  } catch (err) {
    throw err;
  }
}

async function consolidated(payload) {
  try {
    let salaryMonth = new Date(payload.date ?? new Date());
    salaryMonth = new Date(
      salaryMonth.toISOString().replace(/T.*Z/, "T00:00:00Z")
    );
    salaryMonth.setDate(1);
    salaryMonth.setMonth(salaryMonth.getMonth() - 1);
    let leaveMonth = new Date(salaryMonth);
    leaveMonth.setMonth(leaveMonth.getMonth() - 2);
    let fromDate = new Date(salaryMonth);
    let toDate = new Date(salaryMonth);
    toDate.setMonth(salaryMonth.getMonth() + 1);

    let employees = await Employee.aggregate([
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "employee",
          pipeline: [
            {
              $lookup: {
                from: "branches",
                localField: "username",
                foreignField: "branchId",
                as: "branch",
              },
            },
            {
              $addFields: {
                branch: { $first: "$branch" },
              },
            },
          ],
          as: "user",
        },
      },
      {
        $lookup: {
          from: "attendances",
          localField: "_id",
          foreignField: "employee",
          let: { shiftStartTime: "$shiftStartTime" },
          pipeline: [
            {
              $match: {
                $and: [
                  { attendanceDate: { $gte: fromDate } },
                  { attendanceDate: { $lt: toDate } },
                ],
              },
            },
            {
              $addFields: {
                shiftStartTime: {
                  $dateFromString: { dateString: "$$shiftStartTime" },
                },
              },
            },
            {
              $addFields: {
                startHour: {
                  $hour: "$shiftStartTime",
                },
                startMinute: {
                  $minute: "$shiftStartTime",
                },
                dateHour: {
                  $hour: "$attendanceDate",
                },
                dateMinute: {
                  $minute: "$attendanceDate",
                },
              },
            },
            {
              $addFields: {
                startMinute: {
                  $sum: [{ $multiply: ["$startHour", 60] }, "$startMinute"],
                },
                dateMinute: {
                  $sum: [{ $multiply: ["$dateHour", 60] }, "$dateMinute"],
                },
              },
            },
            {
              $addFields: {
                lateMins: {
                  $subtract: ["$startMinute", "$dateMinute"],
                },
              },
            },
            {
              $addFields: {
                lateDays: {
                  $cond: {
                    if: { $gt: ["$lateMins", 5] },
                    then: 1,
                    else: 0,
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                present: { $count: {} },
                lateMins: { $sum: "$lateMins" },
                lateDays: { $sum: "$lateDays" },
              },
            },
            {
              $project: {
                _id: 0,
                present: 1,
                lateMins: 1,
                lateDays: 1,
              },
            },
          ],
          as: "attendance",
        },
      },
      {
        $lookup: {
          from: "payprocesses",
          localField: "_id",
          foreignField: "employee",
          pipeline: [
            {
              $match: {
                $and: [
                  { createdAt: { $gte: fromDate } },
                  { createdAt: { $lt: toDate } },
                ],
              },
            },
            {
              $addFields: {
                allowances: {
                  $cond: {
                    if: { $eq: ["$type", "allowances"] },
                    then: "$amount",
                    else: 0,
                  },
                },
                deductions: {
                  $cond: {
                    if: { $eq: ["$type", "deductions"] },
                    then: "$amount",
                    else: 0,
                  },
                },
                advance: {
                  $cond: {
                    if: { $eq: ["$type", "advance"] },
                    then: "$amount",
                    else: 0,
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                allowances: { $sum: "$allowances" },
                deductions: { $sum: "$deductions" },
                advance: { $sum: "$advance" },
              },
            },
          ],
          as: "payprocess",
        },
      },
      {
        $lookup: {
          from: "leaves",
          localField: "_id",
          foreignField: "employee",
          pipeline: [
            {
              $match: {
                status: "approved",
                createdAt: { $gte: leaveMonth },
              },
            },
            { $unwind: "$dates" },
            {
              $match: {
                $and: [
                  { dates: { $gte: fromDate } },
                  { dates: { $lt: toDate } },
                ],
              },
            },
            { $count: "leave" },
          ],
          as: "leave",
        },
      },
      {
        $addFields: {
          user: { $first: "$user" },
          attendance: { $first: "$attendance" },
          payprocess: { $first: "$payprocess" },
          leave: { $first: "$leave" },
        },
      },
      {
        $project: {
          _id: 1,
          employeeId: 1,
          name: 1,
          gender: 1,
          dob: 1,
          phoneNumber: 1,
          alternatePhoneNumber: 1,
          designation: 1,
          salary: 1,
          shiftEndTime: 1,
          shiftStartTime: 1,
          branchId: "$user.branch.branchId",
          branchName: "$user.branch.branchName",
          present: "$attendance.present",
          lateMins: "$attendance.lateMins",
          lateDays: "$attendance.lateDays",
          allowances: "$payprocess.allowances",
          deductions: "$payprocess.deductions",
          advance: "$payprocess.advance",
          leave: "$leave.leave",
        },
      },
    ]).exec();

    let report = [];
    for (let e of employees) {
      let emp = {
        employee: e,
      };

      emp.present = e.present ?? 0;
      emp.allowances = e.allowances ?? 0;
      emp.deductions = e.deductions ?? 0;
      emp.advance = e.advance ?? 0;
      emp.absent = e.leave ?? 0;
      emp.lateDays = e.lateDays ?? 0;
      emp.lateMins = e.lateMins ?? 0;
      emp.workingDays = new Date(
        salaryMonth.getFullYear(),
        salaryMonth.getMonth() + 1,
        0
      ).getDate();
      emp.salary = +(e.salary ?? 0);
      if (emp.salary > 0) {
        emp.payable = Math.round(
          emp.salary -
            (emp.salary / emp.workingDays) * emp.absent +
            emp.allowances -
            emp.deductions -
            emp.advance
        );
      } else {
        emp.payable = 0;
      }
      report.push(emp);
    }

    return report;
  } catch (err) {
    throw err;
  }
}

async function branchStats(branchId, employeeId = null) {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    let totalEmployees = 0;
    
    if (employeeId) {
      // For single employee: return cumulative month stats
      const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      totalEmployees = await Attendance.countDocuments({
        employee: employeeId,
        attendanceDate: { $gte: monthStart, $lte: endOfDay }
      });
    } else {
      // Try to count directly
      totalEmployees = await Employee.countDocuments({ 
          branch: branchId,
          status: "active"
      });

      // If zero, maybe they haven't been migrated yet.
      // Let's find employees via User -> Branch association.
      if (totalEmployees === 0) {
          const users = await User.find({ branch: branchId, userType: { $ne: 'admin' } });
          const empIds = users.filter(u => u.employee).map(u => u.employee);
          
          if (empIds.length > 0) {
              totalEmployees = await Employee.countDocuments({ 
                  _id: { $in: empIds },
                  status: "active"
              });
              
              // MIGRATION: Update these employees so they have the branch field for next time
              await Employee.updateMany(
                  { _id: { $in: empIds }, branch: { $exists: false } },
                  { $set: { branch: branchId } }
              );
          }
      }
    }

    const presentQuery = {
      branch: branchId,
      attendanceDate: { $gte: startOfDay, $lte: endOfDay }
    };
    if (employeeId) {
      presentQuery.employee = employeeId;
    }

    const presentCount = await Attendance.countDocuments(presentQuery);

    return {
      total: totalEmployees,
      present: presentCount,
      absent: Math.max(0, totalEmployees - presentCount)
    };
  } catch (err) {
    throw err;
  }
}

module.exports = {
  find,
  findById,
  aggregate,
  count,
  create,
  update,
  remove,
  consolidated,
  branchStats,
};
