const service = require('../../services/lead');

async function find(req, res) {
  try {
    const data = await service.find(req.query);
    res.json({ status: true, data });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function create(req, res) {
  try {
    const data = await service.create(req.body);
    res.json({ status: true, data, message: 'Created successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function update(req, res) {
  try {
    const data = await service.update(req.params.id, req.body);
    res.json({ status: true, data, message: 'Updated successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

async function remove(req, res) {
  try {
    await service.remove(req.params.id);
    res.json({ status: true, message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: false, message: err.message });
  }
}

module.exports = { find, create, update, remove };
