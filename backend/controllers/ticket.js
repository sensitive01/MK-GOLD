const ticketService = require("../services/ticket");

async function create(req, res) {
  try {
    const file = req.file;
    const data = await ticketService.create(req.body, file, req.user);
    res.json({ status: true, message: "Ticket raised successfully!", data });
  } catch (err) {
    console.error("Ticket Create Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function findMyRaised(req, res) {
  try {
    const data = await ticketService.findMyRaised(req.user, req.query);
    res.json({ status: true, message: "My raised tickets fetched successfully!", data });
  } catch (err) {
    console.error("Ticket Find My Raised Error:", err);
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findAssignedToMe(req, res) {
  try {
    const data = await ticketService.findAssignedToMe(req.user, req.query);
    res.json({ status: true, message: "Assigned tickets fetched successfully!", data });
  } catch (err) {
    console.error("Ticket Find Assigned Error:", err);
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findAll(req, res) {
  try {
    const data = await ticketService.findAll(req.query);
    res.json({ status: true, message: "All tickets fetched successfully!", data });
  } catch (err) {
    console.error("Ticket Find All Error:", err);
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findById(req, res) {
  try {
    const data = await ticketService.findById(req.params.id);
    if (!data) {
      return res.json({ status: false, message: "Ticket not found", data: {} });
    }
    res.json({ status: true, message: "Ticket fetched successfully!", data });
  } catch (err) {
    console.error("Ticket Find By ID Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function updateStatus(req, res) {
  try {
    const data = await ticketService.updateStatus(req.params.id, req.body, req.user);
    res.json({ status: true, message: `Ticket status updated to ${req.body.status}!`, data });
  } catch (err) {
    console.error("Ticket Update Status Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function update(req, res) {
  try {
    const file = req.file;
    const data = await ticketService.update(req.params.id, req.body, file, req.user);
    res.json({ status: true, message: "Ticket updated successfully!", data });
  } catch (err) {
    console.error("Ticket Update Error:", err);
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    await ticketService.remove(req.params.id, req.user);
    res.json({ status: true, message: "Ticket deleted successfully!" });
  } catch (err) {
    console.error("Ticket Delete Error:", err);
    res.json({ status: false, message: err.message });
  }
}

async function getDesignations(req, res) {
  try {
    const data = await ticketService.getDesignations();
    res.json({ status: true, message: "Designations fetched successfully!", data });
  } catch (err) {
    console.error("Ticket Get Designations Error:", err);
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function getEmployeesByDesignation(req, res) {
  try {
    const data = await ticketService.getEmployeesByDesignation(req.query.designation);
    res.json({ status: true, message: "Employees fetched successfully!", data });
  } catch (err) {
    console.error("Ticket Get Employees Error:", err);
    res.json({ status: false, message: err.message, data: [] });
  }
}

module.exports = {
  create,
  findMyRaised,
  findAssignedToMe,
  findAll,
  findById,
  updateStatus,
  update,
  remove,
  getDesignations,
  getEmployeesByDesignation,
};

