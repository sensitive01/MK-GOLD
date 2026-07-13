const express = require("express");
const router = express.Router();

const {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  addDailyStatus,
  addLoadAmount,
  updateLoadAmountStatus,
  getAllLoadAmounts
} = require("../controllers/campaign");

router.post("/", createCampaign);
router.get("/", getCampaigns);
router.get("/load-amounts/all", getAllLoadAmounts);
router.get("/:id", getCampaignById);
router.put("/:id", updateCampaign);
router.post("/:id/daily-status", addDailyStatus);
router.post("/:id/load-amount", addLoadAmount);
router.put("/:campaignId/load-amount/:loadAmountId", updateLoadAmountStatus);

module.exports = router;
