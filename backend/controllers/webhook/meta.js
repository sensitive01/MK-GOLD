const axios = require("axios");
const leadService = require("../../services/lead");
const Lead = require("../../models/lead");

// 1. GET /api/v1.0/webhook/meta — Meta Webhook Handshake Verification
async function verifyMetaWebhook(req, res) {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    // Check against configured token or default fallback
    const expectedToken = process.env.META_VERIFY_TOKEN || process.env.CRM_WEBHOOK_KEY || "mkgold_meta_verify_2026";

    if (mode && token) {
      if (mode === "subscribe" && token === expectedToken) {
        console.log("META_WEBHOOK_VERIFIED: Verification handshake passed successfully");
        return res.status(200).send(challenge);
      } else {
        console.warn("META_WEBHOOK_VERIFY_FAILED: Token mismatch. Received:", token);
        return res.sendStatus(403);
      }
    }
    return res.status(400).send("Invalid verification request format");
  } catch (err) {
    console.error("Error in verifyMetaWebhook:", err);
    return res.status(500).send("Verification error");
  }
}

// 2. POST /api/v1.0/webhook/meta — Ingest Meta Lead Ads
async function handleMetaLead(req, res) {
  // Always respond 200 OK immediately so Meta does not retry or disable the webhook
  res.status(200).json({ status: "EVENT_RECEIVED" });

  try {
    const body = req.body;

    // Case A: Direct Forwarded Lead (e.g. from mkgold.in forwarder, Zapier, Make, or custom backend)
    const clientName = body.name || body.full_name;
    const clientPhone = body.phone || body.mobile || body.phone_number;
    if (clientName && clientPhone) {
      await processNormalizedMetaLead({
        name: clientName,
        phone: clientPhone,
        city: body.city,
        notes: body.notes || body.remarks || (body.email ? `Email: ${body.email}` : ""),
        adName: body.ad_name || body.adName,
        campaignName: body.campaign_name || body.campaignName,
        formId: body.form_id || body.formId || body.lead_id
      });
      return;
    }

    // Case B: Raw Meta Webhook Event ({ object: "page", entry: [...] })
    if (body.object === "page" && Array.isArray(body.entry)) {
      for (const entry of body.entry) {
        if (!Array.isArray(entry.changes)) continue;

        for (const change of entry.changes) {
          if (change.field === "leadgen" && change.value) {
            const { leadgen_id, form_id, ad_id, page_id } = change.value;
            console.log(`Received Meta lead event: leadgen_id=${leadgen_id}, form_id=${form_id}, ad_id=${ad_id}`);

            // Fetch lead details from Meta Graph API
            const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
            if (!accessToken) {
              console.warn("META_PAGE_ACCESS_TOKEN not configured in backend/.env. Saving reference lead.");
              await processNormalizedMetaLead({
                name: "Meta Ad Lead",
                phone: "0000000000",
                notes: `leadgen_id: ${leadgen_id} | form_id: ${form_id} | ad_id: ${ad_id} (Configure META_PAGE_ACCESS_TOKEN to auto-fetch details)`
              });
              continue;
            }

            try {
              const graphUrl = `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${accessToken}`;
              const graphRes = await axios.get(graphUrl);
              const fieldData = graphRes.data.field_data || [];

              let name = "";
              let phone = "";
              let city = "";
              let email = "";
              const otherFields = [];

              for (const field of fieldData) {
                const fName = field.name?.toLowerCase();
                const fVal = Array.isArray(field.values) ? field.values[0] : field.values;

                if (fName.includes("full_name") || fName === "name" || fName.includes("first_name")) {
                  name = fVal;
                } else if (fName.includes("phone") || fName.includes("mobile") || fName.includes("contact")) {
                  phone = fVal;
                } else if (fName.includes("city") || fName.includes("location") || fName.includes("place")) {
                  city = fVal;
                } else if (fName.includes("email")) {
                  email = fVal;
                } else {
                  otherFields.push(`${field.name}: ${fVal}`);
                }
              }

              await processNormalizedMetaLead({
                name: name || "Meta Lead",
                phone: phone,
                city: city,
                notes: `Email: ${email} | Form: ${form_id} | Ad: ${ad_id} | ${otherFields.join(" | ")}`
              });
            } catch (graphErr) {
              console.error("Failed to fetch lead from Meta Graph API:", graphErr.response?.data || graphErr.message);
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Error processing Meta webhook lead:", err);
  }
}

// Helper: Normalizes, deduplicates, and assigns via Option B
async function processNormalizedMetaLead({ name, phone, city, notes, adName, campaignName, formId }) {
  try {
    const rawPhone = String(phone || "").replace(/[^0-9]/g, "");
    const cleanMobile = rawPhone.slice(-10);

    if (!cleanMobile || cleanMobile.length < 10) {
      console.warn("Skipping Meta lead: Invalid phone number:", phone);
      return;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Duplicate check for today
    const existingLead = await Lead.findOne({
      mobile: cleanMobile,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    const remarksParts = ["Source: Meta (Facebook/Instagram) Lead Ads"];
    if (campaignName) remarksParts.push(`Campaign: ${campaignName}`);
    if (adName) remarksParts.push(`Ad: ${adName}`);
    if (formId) remarksParts.push(`Form: ${formId}`);
    if (notes) remarksParts.push(notes);

    if (existingLead) {
      const repeatRemark = `[Repeat Meta Lead ${new Date().toLocaleTimeString('en-IN')}] ${remarksParts.join(" | ")}`;
      await Lead.findByIdAndUpdate(existingLead._id, {
        $push: {
          dispositions: {
            status: "Repeat Enquiry",
            remark: repeatRemark,
            createdAt: new Date()
          }
        },
        $set: { updatedAt: new Date() }
      });
      console.log(`Appended repeat Meta enquiry to lead ${existingLead._id} for mobile ${cleanMobile}`);
      return;
    }

    const leadPayload = {
      name: String(name || "Meta Customer").trim(),
      mobile: cleanMobile,
      city: city ? String(city).trim() : "",
      place: city ? String(city).trim() : "",
      source: "Meta Lead Ads",
      leadSource: "marketing",
      category: "gold",
      remarks: remarksParts.join(" | "),
      date: new Date()
    };

    // Option B: Automatically routes to active telecaller with fewest leads today
    const createdLead = await leadService.create(leadPayload);
    console.log(`Meta lead created: ID=${createdLead._id}, assignedTo=${createdLead.assignedTo}, mobile=${cleanMobile}`);
  } catch (err) {
    console.error("Error in processNormalizedMetaLead:", err);
  }
}

module.exports = {
  verifyMetaWebhook,
  handleMetaLead,
  processNormalizedMetaLead
};
