const salesService = require("../../services/sales");

async function find(req, res) {
  res.json({
    status: true,
    message: "",
    data: await salesService.find(req.body ?? {}),
  });
}

async function findById(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await salesService.findById(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function update(req, res) {
  try {
    if (req.body.status) {
      const performerId = req.user.employee || req.user._id;
      
      const actionMap = {
        'finance pending': 'Finance Pending',
        'release pending': 'Release Pending',
        'admin approval pending': 'Admin Approval Pending',
        'fund transfer pending': 'Fund Transfer Pending (Finance)',
        'completed': 'Completed',
        'rejected': 'Rejected'
      };

      const logEntry = {
        action: actionMap[req.body.status] || req.body.status,
        performedBy: performerId,
        performedAt: new Date(),
        comments: req.body.financeComments || req.body.assigneeComments || req.body.fundTransferComments || req.body.comments,
      };
      const updateData = { ...req.body };
      updateData.actionBy = performerId;
      updateData.actionAt = new Date();
      
      const result = await salesService.updateWithLog(req.params.id, updateData, logEntry);
      res.json({
        status: true,
        message: "",
        data: result,
      });
    } else {
      res.json({
        status: true,
        message: "",
        data: await salesService.update(req.params.id, req.body),
      });
    }
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

async function remove(req, res) {
  try {
    res.json({
      status: true,
      message: "",
      data: await salesService.remove(req.params.id),
    });
  } catch (err) {
    res.json({
      status: false,
      message: err.errors ?? err.message,
      data: {},
    });
  }
}

module.exports = { find, findById, update, remove };
