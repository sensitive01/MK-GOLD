const ImportedLead = require("../../models/importedLead");

async function importLeads(req, res) {
  try {
    const { leads } = req.body;
    if (!leads || !Array.isArray(leads)) {
      return res.status(400).json({ status: false, message: "Invalid leads data", data: {} });
    }

    const branch = req.user ? (req.user.branch?._id || req.user.branch) : null;
    const createdBy = req.user ? req.user._id : null;

    const mappedLeads = leads.map((lead) => ({
      name: lead.name || lead.Name || "",
      phone: lead.phone || lead.Phone || lead.mobile || lead.Mobile || "",
      email: lead.email || lead.Email || "",
      weight: Number(lead.weight || lead.Weight || 0),
      comments: lead.comments || lead.Comments || "",
      pincode: lead.pincode || lead.Pincode || "",
      branch,
      createdBy,
    }));

    // Filter out completely empty rows
    const validLeads = mappedLeads.filter(lead => 
      lead.name || lead.phone || lead.email || lead.weight || lead.comments || lead.pincode
    );

    if (validLeads.length === 0) {
      return res.status(400).json({ status: false, message: "No data found to import", data: {} });
    }

    const createdData = await ImportedLead.insertMany(validLeads);
    res.json({
      status: true,
      message: `${createdData.length} leads imported successfully!`,
      data: createdData,
    });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function find(req, res) {
  try {
    const query = {};
    if (req.user) {
      query.branch = req.user.branch?._id || req.user.branch;
    }
    const data = await ImportedLead.find(query).populate("createdBy", "username").sort({ createdAt: -1 });
    res.json({ status: true, message: "", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    if (id.includes(",")) {
      await ImportedLead.deleteMany({ _id: { $in: id.split(",") } });
    } else {
      await ImportedLead.findByIdAndDelete(id);
    }
    res.json({ status: true, message: "Imported lead deleted successfully!", data: {} });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = { importLeads, find, remove };
