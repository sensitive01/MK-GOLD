const service = require('../../services/designation');

async function find(req, res) {
  try {
    const data = await service.find(req.body ?? {});
    res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function findById(req, res) {
  try {
    const data = await service.findById(req.params.id);
    res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    if (!req.body.name) {
      return res.status(400).json({ status: false, message: "Designation name is required" });
    }
    const data = await service.create(req.body);
    res.json({ status: true, data, message: "Designation created successfully" });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const data = await service.update(req.params.id, req.body);
    res.json({ status: true, data, message: 'Designation updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ status: true, message: 'Designation deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

module.exports = { find, findById, create, update, remove };
