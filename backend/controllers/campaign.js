const Campaign = require("../models/campaign");
const mongoose = require("mongoose");

// Create Campaign
const createCampaign = async (req, res) => {
  try {
    const { campaignId } = req.body;
    const existing = await Campaign.findOne({ campaignId });
    if (existing) {
      return res.status(400).json({ status: false, message: "Campaign ID already exists" });
    }

    const campaign = await Campaign.create(req.body);
    res.status(201).json({ status: true, message: "Campaign created successfully", data: campaign });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

// Get All Campaigns
const getCampaigns = async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ createdAt: -1 });
    res.status(200).json({ status: true, data: campaigns });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

// Get Campaign By Id
const getCampaignById = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ status: false, message: "Campaign not found" });
    }
    res.status(200).json({ status: true, data: campaign });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

// Update Campaign
const updateCampaign = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findByIdAndUpdate(id, req.body, { new: true });
    if (!campaign) {
      return res.status(404).json({ status: false, message: "Campaign not found" });
    }
    res.status(200).json({ status: true, message: "Campaign updated successfully", data: campaign });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

// Add Daily Status
const addDailyStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.body; // YYYY-MM-DD

    // Validate date is within last 3 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const statusDateObj = new Date(date);
    statusDateObj.setHours(0, 0, 0, 0);
    const diff = (today.getTime() - statusDateObj.getTime()) / (1000 * 3600 * 24);

    if (diff < 0 || diff > 3) {
      return res.status(400).json({ status: false, message: "Can only add status for today or the previous 3 dates." });
    }

    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ status: false, message: "Campaign not found" });
    }

    // Check if status for this date already exists
    const existingStatusIndex = campaign.dailyStatuses.findIndex(s => s.date === date);
    if (existingStatusIndex !== -1) {
      // Update existing
      campaign.dailyStatuses[existingStatusIndex] = { ...campaign.dailyStatuses[existingStatusIndex]._doc, ...req.body };
    } else {
      // Add new
      campaign.dailyStatuses.push(req.body);
    }

    await campaign.save();
    res.status(200).json({ status: true, message: "Daily status updated successfully", data: campaign });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

// Add Load Amount
const addLoadAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ status: false, message: "Campaign not found" });
    }

    campaign.loadAmounts.push(req.body);
    await campaign.save();
    res.status(200).json({ status: true, message: "Load amount added successfully", data: campaign });
  } catch (error) {
    res.status(500).json({ status: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaignById,
  updateCampaign,
  addDailyStatus,
  addLoadAmount
};
