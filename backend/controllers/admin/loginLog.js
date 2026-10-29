const loginLogService = require("../../services/loginLog");

async function getLogs(req, res) {
  try {
    const querySource = { ...req.query, ...req.body };
    const params = {
      search: querySource.search,
      status: querySource.status,
      userType: querySource.userType,
      startDate: querySource.startDate,
      endDate: querySource.endDate,
      page: querySource.page,
      limit: querySource.limit,
    };

    const data = await loginLogService.find(params);
    res.json({
      status: true,
      message: "Login logs retrieved successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || "Failed to retrieve login logs",
      data: { logs: [], totalCount: 0, page: 1, limit: 25, totalPages: 1 },
    });
  }
}

async function getStats(req, res) {
  try {
    const data = await loginLogService.getStats();
    res.json({
      status: true,
      message: "Login stats retrieved successfully",
      data,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message || "Failed to retrieve login stats",
      data: {},
    });
  }
}

module.exports = {
  getLogs,
  getStats,
};
