const employeeService = require("../../services/employee");
const leaveService = require("../../services/leave");
const expenseService = require("../../services/expense");

async function get(req, res) {
  const date = new Date().toISOString().slice(0, 10);
  const totalPresent = await employeeService.aggregate([
    {
      $lookup: {
        from: "attendances",
        localField: "_id",
        foreignField: "employee",
        pipeline: [
          {
            $addFields: {
              convertedDate: {
                $dateToString: {
                  date: "$attendanceDate",
                  format: "%Y-%m-%d",
                },
              },
            },
          },
          {
            $match: { convertedDate: date },
          },
        ],
        as: "attendance",
      },
    },
    { $match: { attendance: { $exists: true, $not: { $size: 0 } } } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  const totalAbsent = await employeeService.aggregate([
    {
      $lookup: {
        from: "attendances",
        localField: "_id",
        foreignField: "employee",
        pipeline: [
          {
            $addFields: {
              convertedDate: {
                $dateToString: {
                  date: "$attendanceDate",
                  format: "%Y-%m-%d",
                },
              },
            },
          },
          {
            $match: { convertedDate: date },
          },
        ],
        as: "attendance",
      },
    },
    { $match: { attendance: { $size: 0 } } },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  const totalLate = await employeeService.aggregate([
    {
      $addFields: {
        shiftStartTime: {
          $dateFromString: { dateString: "$shiftStartTime" },
        },
      },
    },
    {
      $project: {
        date: {
          $dateToParts: { date: "$shiftStartTime" },
        },
      },
    },
    {
      $lookup: {
        from: "attendances",
        localField: "_id",
        foreignField: "employee",
        pipeline: [
          {
            $addFields: {
              convertedDate: {
                $dateToString: {
                  date: "$attendanceDate",
                  format: "%Y-%m-%d",
                },
              },
              date: {
                $dateToParts: { date: "$attendanceDate" },
              },
            },
          },
          {
            $match: {
              convertedDate: date,
            },
          },
        ],
        as: "attendance",
      },
    },
    {
      $match: {
        attendance: {
          $exists: true,
          $not: { $size: 0 },
        },
        "date.hour": {
          $exists: true,
        },
        $expr: {
          $or: [
            { $lt: ["$date.hour", "$attendance.date.hour"] },
            { $lt: ["$date.minute", "$attendance.date.minute"] },
          ],
        },
      },
    },
    { $group: { _id: null, count: { $sum: 1 } } },
  ]);

  const femaleEmployeeCount = await employeeService.count({ status: "active", gender: "female" });
  const maleEmployeeCount = await employeeService.count({ status: "active", gender: "male" });

  const leavesTodayCount = await leaveService.count({
    leaveCategory: "Leave",
    createdAt: {
      $gte: new Date(date + "T00:00:00.000Z"),
      $lte: new Date(date + "T23:59:59.999Z"),
    },
  });

  const permissionsTodayCount = await leaveService.count({
    leaveCategory: "Permission",
    createdAt: {
      $gte: new Date(date + "T00:00:00.000Z"),
      $lte: new Date(date + "T23:59:59.999Z"),
    },
  });

  const totalExpenses = await expenseService.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(date + "T00:00:00.000Z"),
          $lte: new Date(date + "T23:59:59.999Z"),
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const expensesTodayCount = totalExpenses[0]?.total ?? 0;

  res.json({
    status: true,
    message: "",
    data: {
      totalPresent: totalPresent[0]?.count ?? 0,
      totalAbsent: totalAbsent[0]?.count ?? 0,
      totalLate: totalLate[0]?.count ?? 0,
      totalEmployee: await employeeService.count({ status: "active" }),
      femaleEmployeeCount,
      maleEmployeeCount,
      leavesTodayCount,
      permissionsTodayCount,
      expensesTodayCount,
    },
  });
}

module.exports = { get };
