const leadService = require("../../services/lead");
const Lead = require("../../models/lead");

async function createWebLead(req, res) {
  try {
    const {
      name,
      phone,
      city,
      gold_type,
      weight_grams,
      purity_karat,
      notes,
      source,
      estimated_value,
      pincode
    } = req.body || {};

    // 1. Mandatory field validation
    if (!name || !phone) {
      return res.status(400).json({
        status: false,
        message: "name and phone are required"
      });
    }

    const cleanMobile = String(phone).replace(/[\s\-\+]/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(cleanMobile)) {
      return res.status(400).json({
        status: false,
        message: "Enter a valid 10-digit Indian mobile number"
      });
    }

    // 2. Source mapping
    let sourceLabel = "Website Lead";
    if (source === "calculator-gate") sourceLabel = "Calculator Lead Form";
    else if (source === "popup-lead-form") sourceLabel = "Website Popup";
    else if (source === "meta-lead") sourceLabel = "Meta Lead Ads";
    else if (source) sourceLabel = source;

    // 3. Compile remarks from extra fields
    const remarkDetails = [];
    if (notes) remarkDetails.push(`Notes: ${notes}`);
    if (gold_type) remarkDetails.push(`Gold Type: ${gold_type}`);
    if (purity_karat) remarkDetails.push(`Purity: ${purity_karat}K`);
    if (estimated_value) remarkDetails.push(`Est Value: ₹${estimated_value}`);
    if (pincode) remarkDetails.push(`Pincode: ${pincode}`);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // 4. Duplicate check for today
    const existingLead = await Lead.findOne({
      mobile: cleanMobile,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    });

    if (existingLead) {
      // Append repeat enquiry note so telecaller is notified of customer's renewed interest
      const repeatRemark = `[Repeat Enquiry ${new Date().toLocaleTimeString('en-IN')}] ${remarkDetails.join(" | ") || sourceLabel}`;
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

      return res.status(200).json({
        status: true,
        message: "Repeat enquiry recorded for existing lead today",
        data: {
          id: existingLead._id,
          assignedTo: existingLead.assignedTo,
          isRepeat: true
        }
      });
    }

    // 5. Build normalized lead payload
    const leadPayload = {
      name: String(name).trim(),
      mobile: cleanMobile,
      city: city ? String(city).trim() : "",
      place: city ? String(city).trim() : "",
      source: sourceLabel,
      leadSource: "marketing",
      category: "gold",
      weight: parseFloat(weight_grams) || 0,
      remarks: remarkDetails.join(" | "),
      date: new Date()
    };

    // 6. Create lead (Option B: automatically assigns to active telecaller with least leads today)
    const createdLead = await leadService.create(leadPayload);

    return res.status(201).json({
      status: true,
      message: "Lead created and assigned successfully",
      data: {
        id: createdLead._id,
        assignedTo: createdLead.assignedTo,
        isRepeat: false
      }
    });
  } catch (err) {
    console.error("Error in createWebLead webhook controller:", err);
    return res.status(500).json({
      status: false,
      message: err.message || "Internal Server Error"
    });
  }
}

module.exports = { createWebLead };
