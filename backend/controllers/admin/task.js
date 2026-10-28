const taskService = require("../../services/task");

async function find(req, res) {
  try {
    const data = await taskService.find(req.method === "POST" ? req.body : req.query);
    res.json({ status: true, message: "Tasks fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findById(req, res) {
  try {
    const data = await taskService.findById(req.params.id);
    if (!data) {
      return res.json({ status: false, message: "Task not found", data: {} });
    }
    res.json({ status: true, message: "Task fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function findForUser(req, res) {
  try {
    const data = await taskService.findForUser(req.user);
    res.json({ status: true, message: "User tasks fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function create(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    const data = await taskService.create(req.body, files, req.user);
    res.json({ status: true, message: "Task created successfully!", data });
  } catch (err) {
    console.error("Task Create Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function update(req, res) {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    const data = await taskService.update(req.params.id, req.body, files, req.user);
    res.json({ status: true, message: "Task updated successfully!", data });
  } catch (err) {
    console.error("Task Update Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function updateStatus(req, res) {
  try {
    const data = await taskService.updateStatus(req.params.id, req.body, req.user);
    res.json({ status: true, message: "Task status updated successfully!", data });
  } catch (err) {
    console.error("Task Update Status Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    const data = await taskService.remove(req.params.id);
    res.json({ status: true, message: "Task deleted successfully!", data });
  } catch (err) {
    console.error("Task Delete Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = {
  find,
  findById,
  findForUser,
  create,
  update,
  updateStatus,
  remove,
};
