const express = require("express");
const router = express.Router();

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  addDailyStatus,
  addLoadAmount
} = require("../controllers/campaign");

router.post("/", createCampaign);
router.get("/", getCampaigns);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign);
router.post("/:id/daily-status", addDailyStatus);
router.post("/:id/load-amount", addLoadAmount);

module.exports = router;
