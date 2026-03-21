const announcementService = require("../../services/announcement");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  try {
    const data = await announcementService.find(req.body);
    res.json({ status: true, message: "Announcements fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function findById(req, res) {
  try {
    const data = await announcementService.findById(req.params.id);
    res.json({ status: true, message: "Announcement fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function create(req, res) {
  try {
    if (req.user) {
      req.body.createdBy = req.user._id;
    }
    if (req.body.targetUser === "") {
      req.body.targetUser = null;
    }
    if (req.body.expiryDate === "") {
      req.body.expiryDate = null;
    }
    const data = await announcementService.create(req.body);
    if (req.file) {
      await fileUploadService.create({
        uploadId: data._id,
        uploadName: "announcement",
        uploadType: "image",
        uploadedFile: req.file,
      });
    }
    res.json({ status: true, message: "Announcement created successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function update(req, res) {
  try {
    if (req.body.targetUser === "") {
      req.body.targetUser = null;
    }
    if (req.body.expiryDate === "") {
      req.body.expiryDate = null;
    }
    const data = await announcementService.update(req.params.id, req.body);
    if (req.file) {
      await fileUploadService.removeMany({
        uploadId: req.params.id,
        uploadName: "announcement",
      });
      await fileUploadService.create({
        uploadId: req.params.id,
        uploadName: "announcement",
        uploadType: "image",
        uploadedFile: req.file,
      });
    }
    res.json({ status: true, message: "Announcement updated successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    const data = await announcementService.remove(req.params.id);
    res.json({ status: true, message: "Announcement deleted successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function getForUser(req, res) {
  try {
    console.log("DEBUG: Controller fetching for user:", req.user?.username, "Role:", req.user?.userType);
    const data = await announcementService.findForUser(req.user);
    res.json({ status: true, message: "Announcements fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function markAsSeen(req, res) {
  try {
    const data = await announcementService.markAsSeen(req.params.id, req.user._id);
    res.json({ status: true, message: "Announcement marked as seen!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = { find, findById, create, update, remove, getForUser, markAsSeen };
