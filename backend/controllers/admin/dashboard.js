const goldRateService = require("../../services/goldrate");
const customerService = require("../../services/customer");
const salesService = require("../../services/sales");
const expenseService = require("../../services/expense");
const Release = require("../../models/release");
const Melting = require("../../models/melting");
const Fund = require("../../models/fund");
const Lead = require("../../models/lead");
const Salary = require("../../models/salary");
const Attendance = require("../../models/attendance");
const Employee = require("../../models/employee");
const attendanceService = require("../../services/attendance");

async function get(req, res) {
  const date = new Date().toISOString();
  const todayStart = new Date(date.replace(/T.*Z/, "T00:00:00Z"));
  const todayEnd = new Date(date.replace(/T.*Z/, "T23:59:59Z"));

  const goldRate = await goldRateService.findOne({
    date: date,
    state: "Karnataka",
    type: "gold",
  });
  
  const silverRate = await goldRateService.findOne({
    date: date,
    state: "Karnataka",
    type: "silver",
  });

  const totalGrossWeight = await salesService.aggregate([
    { $unwind: "$ornaments" },
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$ornaments.grossWeight" } } },
  ]);
  const totalSilverGrossWeight = await salesService.aggregate([
    { $unwind: "$ornaments" },
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
        purchaseType: "silver",
      },
    },
    { $group: { _id: null, total: { $sum: "$ornaments.grossWeight" } } },
  ]);
  const totalNetAmount = await salesService.aggregate([
    { $unwind: "$ornaments" },
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$ornaments.netAmount" } } },
  ]);
  const totalExpenses = await expenseService.aggregate([
    {
      $match: {
        createdAt: {
          $gte: todayStart,
          $lte: todayEnd,
        },
      },
    },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const pendingRelease = await Release.countDocuments({ status: "release pending" });
  const gattySalesCount = await Melting.countDocuments({ status: "sold" });
  
  const totalFundsInward = await Fund.aggregate([
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const overallLeads = await Lead.countDocuments({});
  
  const Payprocess = require("../../models/payprocess");
  
  const salaryAdvances = await Payprocess.aggregate([
    {
      $match: {
        type: "advance",
      }
    },
    { $group: { _id: null, total: { $sum: "$amount" } } }
  ]);
  const salaryAdvance = salaryAdvances[0]?.total || 0;

  const strDate = date.substring(0, 10);
  const todayAttendances = await Attendance.aggregate([
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
      $match: { convertedDate: strDate },
    },
  ]);
  
  const presentCount = todayAttendances.length;
  
  const allActiveEmployees = await Employee.find({ status: "active" });
  const employeeMap = new Map();
  allActiveEmployees.forEach(emp => employeeMap.set(emp._id.toString(), emp));

  const lateCount = todayAttendances.filter(a => {
    const loginTime = a.loginTime || a.attendanceDate || a.createdAt;
    if (!loginTime) return false;
    const emp = employeeMap.get(a.employee?.toString());
    if (!emp || !emp.shiftStartTime) return false;

    const login = new Date(loginTime);
    let shiftStartTime = emp.shiftStartTime;
    
    let shiftHours = 0;
    let shiftMins = 0;
    
    if (typeof shiftStartTime === 'string' && (shiftStartTime.includes('T') || shiftStartTime.includes('-'))) {
        const d = new Date(shiftStartTime);
        if (!isNaN(d.getTime())) {
            shiftHours = d.getHours();
            shiftMins = d.getMinutes();
        }
    } else {
        const shiftTimeParts = String(shiftStartTime).split(/[: ]/);
        shiftHours = parseInt(shiftTimeParts[0] || 0, 10);
        shiftMins = parseInt(shiftTimeParts[1] || 0, 10);
        if (String(shiftStartTime).toLowerCase().includes('pm') && shiftHours !== 12) {
           shiftHours += 12;
        } else if (String(shiftStartTime).toLowerCase().includes('am') && shiftHours === 12) {
           shiftHours = 0;
        }
    }
    
    const loginMinutes = login.getHours() * 60 + login.getMinutes();
    const shiftMinutes = shiftHours * 60 + shiftMins;
    
    return (loginMinutes - shiftMinutes > 5);
  }).length;
  
  const totalEmployees = allActiveEmployees.length;
  const absentCount = totalEmployees - presentCount;

  res.json({
    status: true,
    message: "",
    data: {
      todayGoldRate: goldRate?.rate ?? 0,
      todaySilverRate: silverRate?.rate ?? 0,
      todayCustomers: await customerService.count({
        createdAt: date,
      }),
      todayBills: await salesService.count({
        createdAt: date,
      }),
      todaySilverBills: await salesService.count({
        createdAt: date,
        purchaseType: "silver",
      }),
      todayPhysicalBills: await salesService.count({
        createdAt: date,
        saleType: "physical",
      }),
      todayPledgeBills: await salesService.count({
        createdAt: date,
        saleType: "pledged",
      }),
      totalGrossWeight: totalGrossWeight[0]?.total || 0,
      totalSilverGrossWeight: totalSilverGrossWeight[0]?.total || 0,
      totalNetAmount: totalNetAmount[0]?.total || 0,
      totalExpenses: totalExpenses[0]?.total || 0,
      pendingRelease: pendingRelease || 0,
      gattySalesCount: gattySalesCount || 0,
      totalFundsInward: totalFundsInward[0]?.total || 0,
      overallLeads: overallLeads || 0,
      salaryAdvance: salaryAdvance || 0,
      presentCount: presentCount || 0,
      absentCount: absentCount < 0 ? 0 : absentCount,
      lateCount: lateCount || 0,
    },
  });
}

module.exports = { get };
