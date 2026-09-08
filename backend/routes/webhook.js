const express = require("express");
const router = express.Router();
const webhookLeadController = require("../controllers/webhook/lead");
const webhookMetaController = require("../controllers/webhook/meta");

// Security Middleware: Verifies the shared pre-shared secret key
function verifyWebhookKey(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || !process.env.CRM_WEBHOOK_KEY || apiKey !== process.env.CRM_WEBHOOK_KEY) {
    return res.status(401).json({
      status: false,
      message: "Unauthorized: Invalid or missing API Key"
    });
  }
  next();
}

// 1. Leads Webhook (Calculator Form, Website Popup, and general Web leads)
router.post("/leads", verifyWebhookKey, webhookLeadController.createWebLead);

// 2. Meta (Facebook & Instagram) Lead Ads Webhook
// GET: Used by Meta Developer App to verify webhook URL (hub.mode, hub.challenge, hub.verify_token)
router.get("/meta", webhookMetaController.verifyMetaWebhook);
// POST: Used by Meta to deliver live lead events
router.post("/meta", webhookMetaController.handleMetaLead);

// 3. Health check for webhook receiver
router.get("/health", (req, res) => {
  res.json({ status: true, message: "Webhook service is running 🚀" });
});

module.exports = router;
