const leadService = require("../../services/lead");
const Lead = require("../../models/lead");

async function createWebLead(req, res) {
  try {
    const {
      name,
      phone,
      city,
      state,
      pincode,
      weight_grams,
      notes,
      source,
      category,
      type,
      unit,
    } = req.body || {};

    // 1. Mandatory field validation
    if (!name || !phone || !source) {
      return res.status(400).json({
        status: false,
        message: "name, phone and source are required"
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
    if (source === "calculator-gate")  sourceLabel = "Calculator Lead Form";
    else if (source === "popup-lead-form")  sourceLabel = "Website Popup";
    else if (source === "website-contact")  sourceLabel = "Website Contact";
    else if (source === "meta-lead")        sourceLabel = "Meta Lead Ads";
    else if (source)                        sourceLabel = source;

    // 3. Only store the customer's notes in remarks — telecaller fills the rest after calling
    const remarks = notes ? String(notes).trim() : "";

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
      const repeatRemark = `[Repeat Enquiry ${new Date().toLocaleTimeString("en-IN")}] ${remarkDetails.join(" | ") || sourceLabel}`;
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

    // 5. Build lead payload — all fields mapped to Lead model schema
    const leadPayload = {
      name:       String(name).trim(),
      mobile:     cleanMobile,
      city:       city    ? String(city).trim()    : "",
      place:      city    ? String(city).trim()    : "",
      state:      state   ? String(state).trim()   : "",
      pincode:    pincode ? String(pincode).trim() : "",
      source:     sourceLabel,
      leadSource: "marketing",
      category:   ["gold", "silver"].includes(category) ? category : "gold",
      type:       ["physical", "pledged"].includes(type) ? type : "physical",
      unit:       unit || "gm",
      weight:     parseFloat(weight_grams) || 0,
      remarks,
      date:              new Date(),
    };

    // 6. Create lead — auto assigns to next telecaller via round-robin
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
