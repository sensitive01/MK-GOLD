const employeeService = require("../../services/employee");

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

  res.json({
    status: true,
    message: "",
    data: {
      totalPresent: totalPresent[0]?.count ?? 0,
      totalAbsent: totalAbsent[0]?.count ?? 0,
      totalLate: totalLate[0]?.count ?? 0,
      totalEmployee: await employeeService.count({ createdAt: date }),
    },
  });
}

module.exports = { get };
