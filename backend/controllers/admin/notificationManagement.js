const notificationService = require("../../services/notificationManagement");
const fileUploadService = require("../../services/fileupload");

async function find(req, res) {
  try {
    const data = await notificationService.find(req.body || {});
    res.json({ status: true, message: "Notifications fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function findById(req, res) {
  try {
    const data = await notificationService.findById(req.params.id);
    res.json({ status: true, message: "Notification fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function create(req, res) {
  try {
    const payload = req.body || {};
    if (req.user) {
      payload.createdBy = req.user._id;
    }
    if (payload.targetUser === "" || payload.targetUser === "undefined" || payload.targetUser === "null") {
      payload.targetUser = null;
    }
    if (payload.expiryDate === "" || payload.expiryDate === "undefined" || payload.expiryDate === "null") {
      payload.expiryDate = null;
    }
    if (typeof payload.targetRoles === "string") {
      try {
        payload.targetRoles = JSON.parse(payload.targetRoles);
      } catch (e) {
        payload.targetRoles = payload.targetRoles.split(",").map((r) => r.trim());
      }
    }
    if (typeof payload.isActive === "string") {
      payload.isActive = payload.isActive === "true";
    }

    if (req.file) {
      payload.image = req.file.path || req.file.secure_url || req.file.filename || "";
    }

    const data = await notificationService.create(payload);

    if (req.file) {
      try {
        await fileUploadService.create({
          uploadId: data._id,
          uploadName: "notification",
          uploadType: "image",
          uploadedFile: req.file,
        });
      } catch (uploadErr) {
        console.error("Image upload secondary record error:", uploadErr.message);
      }
    }

    res.json({ status: true, message: "Notification created successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function update(req, res) {
  try {
    const payload = req.body || {};
    if (payload.targetUser === "" || payload.targetUser === "undefined" || payload.targetUser === "null") {
      payload.targetUser = null;
    }
    if (payload.expiryDate === "" || payload.expiryDate === "undefined" || payload.expiryDate === "null") {
      payload.expiryDate = null;
    }
    if (typeof payload.targetRoles === "string") {
      try {
        payload.targetRoles = JSON.parse(payload.targetRoles);
      } catch (e) {
        payload.targetRoles = payload.targetRoles.split(",").map((r) => r.trim());
      }
    }
    if (typeof payload.isActive === "string") {
      payload.isActive = payload.isActive === "true";
    }

    if (req.file) {
      payload.image = req.file.path || req.file.secure_url || req.file.filename || "";
    }

    const data = await notificationService.update(req.params.id, payload);

    if (req.file) {
      try {
        await fileUploadService.removeMany({
          uploadId: req.params.id,
          uploadName: "notification",
        });
        await fileUploadService.create({
          uploadId: req.params.id,
          uploadName: "notification",
          uploadType: "image",
          uploadedFile: req.file,
        });
      } catch (uploadErr) {
        console.error("Image upload update error:", uploadErr.message);
      }
    }

    res.json({ status: true, message: "Notification updated successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function remove(req, res) {
  try {
    const data = await notificationService.remove(req.params.id);
    try {
      await fileUploadService.removeMany({
        uploadId: req.params.id,
        uploadName: "notification",
      });
    } catch (e) {}
    res.json({ status: true, message: "Notification deleted successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

async function getMyNotifications(req, res) {
  try {
    const data = await notificationService.getActiveForUser(req.user);
    res.json({ status: true, message: "Active notifications fetched successfully!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: [] });
  }
}

async function markAsSeen(req, res) {
  try {
    const data = await notificationService.markAsSeen(req.params.id, req.user?._id);
    res.json({ status: true, message: "Notification marked as seen!", data });
  } catch (err) {
    res.json({ status: false, message: err.message, data: {} });
  }
}

module.exports = {
  find,
  findById,
  create,
  update,
  remove,
  getMyNotifications,
  markAsSeen,
};

