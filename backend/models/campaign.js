const mongoose = require("mongoose");

const DailyStatusSchema = mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  running: { type: String, enum: ["yes", "no"], required: true },
  reason: { type: String }, // if no
  schedule: { type: String }, // if yes
  spent: { type: Number, default: 0 },
  impression: { type: Number, default: 0 },
  reach: { type: Number, default: 0 },
  clicks: { type: Number, default: 0 },
  cpc: { type: Number, default: 0 },
  calls: { type: Number, default: 0 },
  leads: { type: Number, default: 0 },
  qualifiedLeads: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 }
}, { timestamps: true });

const LoadAmountSchema = mongoose.Schema({
  date: { type: String, required: true }, // Format: YYYY-MM-DD
  amount: { type: Number, required: true },
  mode: { 
    type: String, 
    enum: ["Net banking", "Credit / debit card", "UPi / QR", "Bank transfer", "Promotion", "Others"],
    required: true 
  },
  type: { type: String }, // text box
  notes: { type: String }
}, { timestamps: true });

const CampaignSchema = mongoose.Schema(
  {
    campaignName: { type: String, required: true },
    campaignId: { type: String, required: true, unique: true }, // Manual entry
    campaignType: { type: String, required: true }, // Awareness, Lead Generation, Engagement, Sales, etc.
    campaignStatus: { type: String, default: "Active" },
    objective: { type: String },
    description: { type: String },
    mailId: { type: String },
    teamMembers: { type: String }, 
    
    // Platform & Targeting
    adPlatform: { type: String, required: true },
    targetPlatform: { type: [String], required: true },
    accountNameUrl: { type: String }, // optional
    landingPageUrl: { type: String }, // optional
    adType: { type: String },
    adFormat: { type: String },
    adFiles: { type: [String] }, // Array of uploaded image/video URLs // Image, Video, Carousel, Reel, Story, Text
    contentCalendar: { type: String },
    ctaLink: { type: String },
    
    // Audience
    targetAudienceDemography: { type: String },
    targetAudienceLocation: { type: String },
    
    // Creative Details
    postHeadings: [{ type: String }],
    postDescriptions: [{ type: String }],
    
    // Strategy
    bidStrategy: { type: String, enum: ["CPC", "CPM", "CPA", ""] },
    
    dailyStatuses: [DailyStatusSchema],
    loadAmounts: [LoadAmountSchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("campaigns", CampaignSchema);
